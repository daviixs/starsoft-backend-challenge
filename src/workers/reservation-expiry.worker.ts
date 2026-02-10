import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Reservation,
  ReservationStatus,
} from '../modules/sessions/entities/reservation.entity';
import { Seat, SeatStatus } from '../modules/sessions/entities/seat.entity';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

@Injectable()
export class ReservationExpiryWorker implements OnModuleInit {
  private readonly logger = new Logger(ReservationExpiryWorker.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    private dataSource: DataSource,
    private kafkaProducer: KafkaProducerService,
    private kafkaConsumer: KafkaConsumerService,
  ) {}

  async onModuleInit() {
    
    await this.kafkaConsumer.subscribe(
      'booking.reserved',
      'expiry-worker-group',
      this.handleReservationCreated.bind(this),
    );

    this.logger.log('Reservation expiry worker initialized');
  }

  



  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkExpiredReservations() {
    this.logger.debug('Running expiry check...');

    try {
      
      const expired = await this.reservationRepository.find({
        where: {
          status: ReservationStatus.PENDING,
          expiresAt: LessThan(new Date()),
        },
      });

      if (expired.length === 0) {
        this.logger.debug('No expired reservations found');
        return;
      }

      this.logger.log(`Found ${expired.length} expired reservations`);

      
      for (const reservation of expired) {
        await this.expireReservation(reservation);
      }

      this.logger.log(`Successfully expired ${expired.length} reservations`);
    } catch (error) {
      this.logger.error('Error checking expired reservations:', error);
    }
  }

  


  private async expireReservation(reservation: Reservation): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      await queryRunner.manager.update(
        Seat,
        { id: In(reservation.seatIds) },
        {
          status: SeatStatus.AVAILABLE,
          reservedUntil: undefined,
        },
      );

      
      await queryRunner.manager.update(
        Reservation,
        { id: reservation.id },
        { status: ReservationStatus.EXPIRED },
      );

      await queryRunner.commitTransaction();

      
      await this.kafkaProducer.publish('booking.expired', {
        reservationId: reservation.id,
        userId: reservation.userId,
        sessionId: reservation.sessionId,
        seatIds: reservation.seatIds,
        expiredAt: new Date().toISOString(),
      });

      this.logger.log(`Reservation expired: ${reservation.id}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to expire reservation ${reservation.id}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  



  private async handleReservationCreated(data: any): Promise<void> {
    this.logger.debug(
      `Received reservation created event: ${data.reservationId}`,
    );

    
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();
    const delayMs = expiresAt.getTime() - now.getTime();

    if (delayMs > 0) {
      
      setTimeout(async () => {
        this.logger.debug(
          `Checking reservation ${data.reservationId} for expiration`,
        );

        const reservation = await this.reservationRepository.findOne({
          where: { id: data.reservationId },
        });

        if (
          reservation &&
          reservation.status === ReservationStatus.PENDING &&
          new Date() > reservation.expiresAt
        ) {
          await this.expireReservation(reservation);
        }
      }, delayMs + 1000); 
    }
  }

  


  async forceExpireReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new Error(`Reservation ${reservationId} is not in pending status`);
    }

    await this.expireReservation(reservation);
  }
}
