import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { RedisLockService } from '../../redis/redis-lock.service';
import { KafkaProducerService } from '../../kafka/kafka.producer.service';
import { ReserveSeatsDto } from '../../dto/reserve-seats.dto';
import {
  Reservation,
  ReservationStatus,
} from '../../modules/sessions/entities/reservation.entity';
import { Seat, SeatStatus } from '../../modules/sessions/entities/seat.entity';
import { Session } from '../../modules/sessions/entities/session.entity';
import {
  SeatUnavailableException,
  SessionNotFoundException,
} from '../../exceptions/business.exceptions';

@Injectable()
export class ReserveSeatsUseCase {
  private readonly logger = new Logger(ReserveSeatsUseCase.name);
  private readonly RESERVATION_TTL_MS = 30000;

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly dataSource: DataSource,
    private readonly redisLock: RedisLockService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async execute(dto: ReserveSeatsDto): Promise<Reservation> {
    const { userId, sessionId, seatNumbers } = dto;

    // Verificar se sessão existe
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    // Idempotência
    const idempotencyKey = this.buildIdempotencyKey(
      userId,
      sessionId,
      seatNumbers,
    );
    const cached = await this.checkCache(idempotencyKey);
    if (cached) return cached;

    // Adquirir locks
    const locks = await this.acquireLocks(sessionId, seatNumbers);
    if (!locks) {
      throw new SeatUnavailableException(seatNumbers);
    }

    try {
      const reservation = await this.createReservation(dto);
      await this.publishEvent(reservation);
      await this.cacheResult(idempotencyKey, reservation);

      return reservation;
    } finally {
      await this.redisLock.releaseMultiple(locks);
    }
  }

  private async createReservation(dto: ReserveSeatsDto): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // SELECT FOR UPDATE (lock pessimista)
      const seats = await queryRunner.manager.find(Seat, {
        where: {
          sessionId: dto.sessionId,
          seatNumber: In(dto.seatNumbers),
          status: SeatStatus.AVAILABLE,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (seats.length !== dto.seatNumbers.length) {
        const found = seats.map((s: Seat) => s.seatNumber);
        const unavailable = dto.seatNumbers.filter(
          (s: string) => !found.includes(s),
        );
        throw new SeatUnavailableException(unavailable);
      }

      const expiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS);

      // Atualizar status dos assentos
      await queryRunner.manager.update(
        Seat,
        { id: In(seats.map((s: Seat) => s.id)) },
        {
          status: SeatStatus.RESERVED,
          reservedUntil: expiresAt,
        },
      );

      // Criar reserva
      const reservation = queryRunner.manager.create(Reservation, {
        userId: dto.userId,
        sessionId: dto.sessionId,
        seatIds: seats.map((s: Seat) => s.id),
        expiresAt,
        status: ReservationStatus.PENDING,
      });

      const savedReservation = await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();
      return savedReservation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private buildIdempotencyKey(
    userId: string,
    sessionId: string,
    seatNumbers: string[],
  ): string {
    return `reserve:${userId}:${sessionId}:${seatNumbers.sort().join(',')}`;
  }

  private async acquireLocks(
    sessionId: string,
    seatNumbers: string[],
  ): Promise<Map<string, string> | null> {
    const lockKeys = seatNumbers
      .sort()
      .map((seat) => `seat:lock:${sessionId}:${seat}`);

    return this.redisLock.acquireMultiple(lockKeys, 5000);
  }

  private async checkCache(key: string): Promise<Reservation | null> {
    return this.redisLock.getCache<Reservation>(key);
  }

  private async cacheResult(
    key: string,
    reservation: Reservation,
  ): Promise<void> {
    await this.redisLock.setCache(key, reservation, 30);
  }

  private async publishEvent(reservation: Reservation): Promise<void> {
    await this.kafkaProducer.publish('booking.reserved', {
      reservationId: reservation.id,
      userId: reservation.userId,
      sessionId: reservation.sessionId,
      seatIds: reservation.seatIds,
      expiresAt: reservation.expiresAt.toISOString(),
    });
  }
}
