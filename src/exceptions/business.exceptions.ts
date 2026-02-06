import { HttpException, HttpStatus } from '@nestjs/common';

export class SeatUnavailableException extends HttpException {
  constructor(seatNumbers: string[]) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'One or more seats are unavailable',
        unavailableSeats: seatNumbers,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ReservationNotFoundException extends HttpException {
  constructor(reservationId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Reservation ${reservationId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ReservationExpiredException extends HttpException {
  constructor(reservationId: string) {
    super(
      {
        statusCode: HttpStatus.GONE,
        message: `Reservation ${reservationId} has expired`,
      },
      HttpStatus.GONE,
    );
  }
}

export class SessionNotFoundException extends HttpException {
  constructor(sessionId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Session ${sessionId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateRequestException extends HttpException {
  constructor(idempotencyKey: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Duplicate request detected',
        idempotencyKey,
      },
      HttpStatus.CONFLICT,
    );
  }
}
