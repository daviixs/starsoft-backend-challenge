import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { ReserveSeatsDto } from '../dto/reserve-seats.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  private readonly logger = new Logger(BookingsController.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Post('reserve')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ strict: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Reservar assentos para uma sessão' })
  @ApiResponse({ status: 201, description: 'Reserva criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Assento(s) indisponível(is)' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  @ApiResponse({ status: 429, description: 'Limite de requisições excedido' })
  async reserve(@Body() dto: ReserveSeatsDto) {
    this.logger.log(
      `Reservation request: User ${dto.userId}, Session ${dto.sessionId}, Seats ${dto.seatNumbers.join(', ')}`,
    );

    const reservation = await this.bookingsService.reserveSeats(dto);

    this.logger.log(`Reservation created: ${reservation.id}`);

    return {
      id: reservation.id,
      userId: reservation.userId,
      sessionId: reservation.sessionId,
      seatIds: reservation.seatIds,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
      message: `Reservation confirmed. Complete payment within 30 seconds.`,
    };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ strict: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Confirmar pagamento de uma reserva' })
  @ApiResponse({ status: 201, description: 'Pagamento confirmado com sucesso' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  @ApiResponse({ status: 410, description: 'Reserva expirada' })
  @ApiResponse({ status: 429, description: 'Limite de requisições excedido' })
  async confirm(@Body() dto: ConfirmPaymentDto) {
    this.logger.log(
      `Payment confirmation request: Reservation ${dto.reservationId}`,
    );

    const sale = await this.bookingsService.confirmPayment(dto);

    this.logger.log(`Payment confirmed: Sale ${sale.id}`);

    return {
      id: sale.id,
      reservationId: sale.reservationId,
      userId: sale.userId,
      totalAmountCents: sale.totalAmountCents,
      confirmedAt: sale.confirmedAt,
      message: 'Payment confirmed successfully!',
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Buscar histórico de compras do usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário (UUID)' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso' })
  async getUserPurchases(@Param('userId') userId: string) {
    this.logger.log(`Fetching purchases for user: ${userId}`);

    const purchases = await this.bookingsService.getUserPurchases(userId);

    return {
      userId,
      totalPurchases: purchases.length,
      purchases: purchases.map((sale) => ({
        id: sale.id,
        totalAmountCents: sale.totalAmountCents,
        confirmedAt: sale.confirmedAt,
        movie: sale.reservation.session.movieName,
        startsAt: sale.reservation.session.startsAt,
        seats: sale.reservation.seatIds.length,
      })),
    };
  }

  @Get('reservation/:id')
  @ApiOperation({ summary: 'Consultar status de uma reserva' })
  @ApiParam({ name: 'id', description: 'ID da reserva (UUID)' })
  @ApiResponse({ status: 200, description: 'Status da reserva retornado' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  async getReservation(@Param('id') id: string) {
    this.logger.log(`Fetching reservation: ${id}`);

    const reservation = await this.bookingsService.getReservation(id);

    return {
      id: reservation.id,
      userId: reservation.userId,
      sessionId: reservation.sessionId,
      seatIds: reservation.seatIds,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
      isExpired: new Date() > reservation.expiresAt,
      timeRemaining:
        reservation.status === 'pending'
          ? Math.max(
              0,
              Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000),
            )
          : 0,
    };
  }
}
