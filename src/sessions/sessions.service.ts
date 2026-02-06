import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Session } from '../modules/sessions/entities/session.entity';
import { Seat, SeatStatus } from '../modules/sessions/entities/seat.entity';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionNotFoundException } from '../exceptions/business.exceptions';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    private dataSource: DataSource,
  ) {}

  /**
   * Cria uma sessão com assentos
   */
  async createSession(dto: CreateSessionDto): Promise<Session> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar sessão
      const session = queryRunner.manager.create(Session, {
        movieName: dto.movieName,
        roomNumber: dto.roomNumber,
        startsAt: new Date(dto.startsAt),
        priceCents: dto.priceCents,
      });

      const savedSession = await queryRunner.manager.save(session);

      // Gerar assentos (formato: A1, A2, ..., B1, B2, ...)
      const seats = this.generateSeats(savedSession.id, dto.totalSeats);
      await queryRunner.manager.save(Seat, seats);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Session created: ${savedSession.id} with ${dto.totalSeats} seats`,
      );

      return savedSession;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create session:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Busca disponibilidade em tempo real
   */
  async getAvailability(sessionId: string): Promise<{
    session: Session;
    availableSeats: string[];
    reservedSeats: string[];
    soldSeats: string[];
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    const seats = await this.seatRepository.find({
      where: { sessionId },
    });

    return {
      session,
      availableSeats: seats
        .filter((s) => s.status === SeatStatus.AVAILABLE)
        .map((s) => s.seatNumber),
      reservedSeats: seats
        .filter((s) => s.status === SeatStatus.RESERVED)
        .map((s) => s.seatNumber),
      soldSeats: seats
        .filter((s) => s.status === SeatStatus.SOLD)
        .map((s) => s.seatNumber),
    };
  }

  /**
   * Lista todas as sessões
   */
  async findAll(): Promise<Session[]> {
    return this.sessionRepository.find({
      order: { startsAt: 'ASC' },
    });
  }

  /**
   * Gera assentos (A1-A8, B1-B8, ...)
   */
  private generateSeats(sessionId: string, total: number): Seat[] {
    const seats: Seat[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = Math.ceil(total / rows.length);

    let count = 0;
    for (const row of rows) {
      for (let num = 1; num <= seatsPerRow && count < total; num++) {
        seats.push({
          sessionId,
          seatNumber: `${row}${num}`,
          status: SeatStatus.AVAILABLE,
          reservedUntil: null,
        } as unknown as Seat);
        count++;
      }
    }

    return seats;
  }
}
