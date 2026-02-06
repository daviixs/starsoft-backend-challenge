import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsController } from './booking.controller';
import { BookingsService } from './bookings.service';
import { Reservation } from '../modules/sessions/entities/reservation.entity';
import { Sale } from '../modules/sessions/entities/sale.entity';
import { Seat } from '../modules/sessions/entities/seat.entity';
import { Session } from '../modules/sessions/entities/session.entity';
import { ReservationExpiryWorker } from '../workers/reservation-expiry.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Sale, Seat, Session]),
    ScheduleModule.forRoot(), // Habilita Cron jobs
  ],
  controllers: [BookingsController],
  providers: [BookingsService, ReservationExpiryWorker],
  exports: [BookingsService],
})
export class BookingsModule {}
