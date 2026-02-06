import { HttpException } from '@nestjs/common';
export declare class SeatUnavailableException extends HttpException {
    constructor(seatNumbers: string[]);
}
export declare class ReservationNotFoundException extends HttpException {
    constructor(reservationId: string);
}
export declare class ReservationExpiredException extends HttpException {
    constructor(reservationId: string);
}
export declare class SessionNotFoundException extends HttpException {
    constructor(sessionId: string);
}
export declare class DuplicateRequestException extends HttpException {
    constructor(idempotencyKey: string);
}
