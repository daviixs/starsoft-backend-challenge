"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const booking_controller_1 = require("./booking.controller");
const bookings_service_1 = require("./bookings.service");
const reservation_entity_1 = require("../modules/sessions/entities/reservation.entity");
const sale_entity_1 = require("../modules/sessions/entities/sale.entity");
const seat_entity_1 = require("../modules/sessions/entities/seat.entity");
const session_entity_1 = require("../modules/sessions/entities/session.entity");
const reservation_expiry_worker_1 = require("../workers/reservation-expiry.worker");
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([reservation_entity_1.Reservation, sale_entity_1.Sale, seat_entity_1.Seat, session_entity_1.Session]),
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [booking_controller_1.BookingsController],
        providers: [bookings_service_1.BookingsService, reservation_expiry_worker_1.ReservationExpiryWorker],
        exports: [bookings_service_1.BookingsService],
    })
], BookingsModule);
//# sourceMappingURL=booking.module.js.map