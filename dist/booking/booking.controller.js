"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BookingsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const bookings_service_1 = require("./bookings.service");
const reserve_seats_dto_1 = require("../dto/reserve-seats.dto");
const confirm_payment_dto_1 = require("../dto/confirm-payment.dto");
let BookingsController = BookingsController_1 = class BookingsController {
    bookingsService;
    logger = new common_1.Logger(BookingsController_1.name);
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async reserve(dto) {
        this.logger.log(`Reservation request: User ${dto.userId}, Session ${dto.sessionId}, Seats ${dto.seatNumbers.join(', ')}`);
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
    async confirm(dto) {
        this.logger.log(`Payment confirmation request: Reservation ${dto.reservationId}`);
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
    async getUserPurchases(userId) {
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
    async getReservation(id) {
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
            timeRemaining: reservation.status === 'pending'
                ? Math.max(0, Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000))
                : 0,
        };
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)('reserve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, throttler_1.Throttle)({ strict: { ttl: 60000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Reservar assentos para uma sessão' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Reserva criada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Assento(s) indisponível(is)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sessão não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Limite de requisições excedido' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reserve_seats_dto_1.ReserveSeatsDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "reserve", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, throttler_1.Throttle)({ strict: { ttl: 60000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmar pagamento de uma reserva' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Pagamento confirmado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reserva não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 410, description: 'Reserva expirada' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Limite de requisições excedido' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [confirm_payment_dto_1.ConfirmPaymentDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar histórico de compras do usuário' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'ID do usuário (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Histórico retornado com sucesso' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getUserPurchases", null);
__decorate([
    (0, common_1.Get)('reservation/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar status de uma reserva' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID da reserva (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status da reserva retornado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reserva não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getReservation", null);
exports.BookingsController = BookingsController = BookingsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=booking.controller.js.map