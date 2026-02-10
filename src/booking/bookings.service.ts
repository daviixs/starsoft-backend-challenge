import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../modules/sessions/entities/reservation.entity';
import { Sale } from '../modules/sessions/entities/sale.entity';
import { Seat, SeatStatus } from '../modules/sessions/entities/seat.entity';
import { Session } from '../modules/sessions/entities/session.entity';
import { ReserveSeatsDto } from '../dto/reserve-seats.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { RedisLockService } from '../redis/redis-lock.service';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import {
  SeatUnavailableException,
  SessionNotFoundException,
  ReservationNotFoundException,
  ReservationExpiredException,
} from '../exceptions/business.exceptions';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly RESERVATION_TTL_MS = 30000;

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private dataSource: DataSource,
    private redisLock: RedisLockService,
    private kafkaProducer: KafkaProducerService,
  ) {}

  async reserveSeats(dto: ReserveSeatsDto): Promise<Reservation> {
    const { userId, sessionId, seatNumbers } = dto;
    const sortedSeatNumbers = [...seatNumbers].sort();

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    const idempotencyKey = this.generateIdempotencyKey(
      userId,
      sessionId,
      seatNumbers,
    );

    const cached = await this.redisLock.getCache<Reservation>(idempotencyKey);
    if (cached) {
      this.logger.debug(`Returning cached reservation: ${cached.id}`);
      return cached;
    }

    const lockKeys = sortedSeatNumbers.map(
      (seat) => `seat:lock:${sessionId}:${seat}`,
    );

    const locks = await this.redisLock.acquireMultiple(lockKeys, 5000);

    if (!locks) {
      throw new SeatUnavailableException(seatNumbers);
    }

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const seats = await queryRunner.manager.find(Seat, {
          where: {
            sessionId,
            seatNumber: In(sortedSeatNumbers),
            status: SeatStatus.AVAILABLE,
          },
          order: { seatNumber: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        });

        if (seats.length !== sortedSeatNumbers.length) {
          const foundSeats = seats.map((s) => s.seatNumber);
          const unavailable = sortedSeatNumbers.filter(
            (s) => !foundSeats.includes(s),
          );
          throw new SeatUnavailableException(unavailable);
        }

        const expiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS);

        await queryRunner.manager.update(
          Seat,
          { id: In(seats.map((s) => s.id)) },
          {
            status: SeatStatus.RESERVED,
            reservedUntil: expiresAt,
          },
        );

        const reservation = queryRunner.manager.create(Reservation, {
          userId,
          sessionId,
          seatIds: seats.map((s) => s.id),
          expiresAt,
          status: ReservationStatus.PENDING,
        });

        const savedReservation = await queryRunner.manager.save(reservation);

        await queryRunner.commitTransaction();

        await this.kafkaProducer.publish('booking.reserved', {
          reservationId: savedReservation.id,
          userId,
          sessionId,
          seatNumbers,
          expiresAt: expiresAt.toISOString(),
        });

        await this.redisLock.setCache(idempotencyKey, savedReservation, 30);

        this.logger.log(
          `Reservation created: ${savedReservation.id} for seats ${seatNumbers.join(', ')}`,
        );

        return savedReservation;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } finally {
      await this.redisLock.releaseMultiple(locks);
    }
  }

  async confirmPayment(dto: ConfirmPaymentDto): Promise<Sale> {
    const { reservationId, userId, idempotencyKey: providedKey } = dto;
    const idempotencyKey =
      providedKey || `confirm:${reservationId}:${userId}`.toLowerCase();

    const cachedSale = await this.redisLock.getCache<Sale>(idempotencyKey);
    if (cachedSale) {
      this.logger.debug(`Returning cached sale for ${idempotencyKey}`);
      return cachedSale;
    }

    const lockKey = `reservation:confirm:${reservationId}`;
    const lock = await this.redisLock.acquire(lockKey, 8000, 5, 50);
    if (!lock) {
      throw new ConflictException('Reservation confirmation in progress');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: reservationId, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        throw new ReservationNotFoundException(reservationId);
      }

      if (new Date() > reservation.expiresAt) {
        throw new ReservationExpiredException(reservationId);
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        const existingSale = await queryRunner.manager.findOne(Sale, {
          where: { reservationId },
        });
        if (existingSale) {
          await this.redisLock.setCache(idempotencyKey, existingSale, 300);
          await queryRunner.commitTransaction();
          return existingSale;
        }
      }

      await queryRunner.manager.update(
        Seat,
        { id: In(reservation.seatIds) },
        { status: SeatStatus.SOLD, reservedUntil: undefined },
      );

      await queryRunner.manager.update(
        Reservation,
        { id: reservationId },
        { status: ReservationStatus.CONFIRMED },
      );

      const session = await queryRunner.manager.findOne(Session, {
        where: { id: reservation.sessionId },
      });

      if (!session) {
        throw new SessionNotFoundException(reservation.sessionId);
      }

      const sale = queryRunner.manager.create(Sale, {
        reservationId,
        userId,
        totalAmountCents: session.priceCents * reservation.seatIds.length,
      });

      let savedSale: Sale;
      try {
        savedSale = await queryRunner.manager.save(sale);
      } catch (error) {
        if (error?.code === '23505') {
          const existingSale = await queryRunner.manager.findOne(Sale, {
            where: { reservationId },
          });
          if (existingSale) {
            await queryRunner.commitTransaction();
            await this.redisLock.setCache(idempotencyKey, existingSale, 300);
            return existingSale;
          }
        }
        throw error;
      }

      await queryRunner.commitTransaction();

      await this.kafkaProducer.publish('booking.confirmed', {
        saleId: savedSale.id,
        reservationId,
        userId,
        sessionId: reservation.sessionId,
        totalAmountCents: savedSale.totalAmountCents,
      });

      await this.redisLock.setCache(idempotencyKey, savedSale, 300);
      this.logger.log(`Payment confirmed: ${savedSale.id}`);

      return savedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
      await this.redisLock.release(lockKey, lock);
    }
  }

  async getUserPurchases(userId: string): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { userId },
      relations: ['reservation', 'reservation.session'],
      order: { confirmedAt: 'DESC' },
    });
  }

  private generateIdempotencyKey(
    userId: string,
    sessionId: string,
    seatNumbers: string[],
  ): string {
    return `reserve:${userId}:${sessionId}:${seatNumbers.sort().join(',')}`;
  }

  async getReservation(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['session'],
    });

    if (!reservation) {
      throw new ReservationNotFoundException(id);
    }

    return reservation;
  }
}
