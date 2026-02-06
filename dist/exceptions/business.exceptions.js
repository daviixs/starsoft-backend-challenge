"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateRequestException = exports.SessionNotFoundException = exports.ReservationExpiredException = exports.ReservationNotFoundException = exports.SeatUnavailableException = void 0;
const common_1 = require("@nestjs/common");
class SeatUnavailableException extends common_1.HttpException {
    constructor(seatNumbers) {
        super({
            statusCode: common_1.HttpStatus.CONFLICT,
            message: 'One or more seats are unavailable',
            unavailableSeats: seatNumbers,
        }, common_1.HttpStatus.CONFLICT);
    }
}
exports.SeatUnavailableException = SeatUnavailableException;
class ReservationNotFoundException extends common_1.HttpException {
    constructor(reservationId) {
        super({
            statusCode: common_1.HttpStatus.NOT_FOUND,
            message: `Reservation ${reservationId} not found`,
        }, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.ReservationNotFoundException = ReservationNotFoundException;
class ReservationExpiredException extends common_1.HttpException {
    constructor(reservationId) {
        super({
            statusCode: common_1.HttpStatus.GONE,
            message: `Reservation ${reservationId} has expired`,
        }, common_1.HttpStatus.GONE);
    }
}
exports.ReservationExpiredException = ReservationExpiredException;
class SessionNotFoundException extends common_1.HttpException {
    constructor(sessionId) {
        super({
            statusCode: common_1.HttpStatus.NOT_FOUND,
            message: `Session ${sessionId} not found`,
        }, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.SessionNotFoundException = SessionNotFoundException;
class DuplicateRequestException extends common_1.HttpException {
    constructor(idempotencyKey) {
        super({
            statusCode: common_1.HttpStatus.CONFLICT,
            message: 'Duplicate request detected',
            idempotencyKey,
        }, common_1.HttpStatus.CONFLICT);
    }
}
exports.DuplicateRequestException = DuplicateRequestException;
//# sourceMappingURL=business.exceptions.js.map