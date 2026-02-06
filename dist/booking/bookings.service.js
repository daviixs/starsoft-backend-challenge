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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../modules/sessions/entities/reservation.entity");
const sale_entity_1 = require("../modules/sessions/entities/sale.entity");
const seat_entity_1 = require("../modules/sessions/entities/seat.entity");
const session_entity_1 = require("../modules/sessions/entities/session.entity");
const redis_lock_service_1 = require("../redis/redis-lock.service");
const kafka_producer_service_1 = require("../kafka/kafka.producer.service");
const business_exceptions_1 = require("../exceptions/business.exceptions");
let BookingsService = BookingsService_1 = class BookingsService {
    reservationRepository;
    saleRepository;
    seatRepository;
    sessionRepository;
    dataSource;
    redisLock;
    kafkaProducer;
    logger = new common_1.Logger(BookingsService_1.name);
    RESERVATION_TTL_MS = 30000;
    constructor(reservationRepository, saleRepository, seatRepository, sessionRepository, dataSource, redisLock, kafkaProducer) {
        this.reservationRepository = reservationRepository;
        this.saleRepository = saleRepository;
        this.seatRepository = seatRepository;
        this.sessionRepository = sessionRepository;
        this.dataSource = dataSource;
        this.redisLock = redisLock;
        this.kafkaProducer = kafkaProducer;
    }
    async reserveSeats(dto) {
        const { userId, sessionId, seatNumbers } = dto;
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new business_exceptions_1.SessionNotFoundException(sessionId);
        }
        const idempotencyKey = this.generateIdempotencyKey(userId, sessionId, seatNumbers);
        const cached = await this.redisLock.getCache(idempotencyKey);
        if (cached) {
            this.logger.debug(`Returning cached reservation: ${cached.id}`);
            return cached;
        }
        const lockKeys = seatNumbers
            .sort()
            .map((seat) => `seat:lock:${sessionId}:${seat}`);
        const locks = await this.redisLock.acquireMultiple(lockKeys, 5000);
        if (!locks) {
            throw new business_exceptions_1.SeatUnavailableException(seatNumbers);
        }
        try {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const seats = await queryRunner.manager.find(seat_entity_1.Seat, {
                    where: {
                        sessionId,
                        seatNumber: (0, typeorm_2.In)(seatNumbers),
                        status: seat_entity_1.SeatStatus.AVAILABLE,
                    },
                    lock: { mode: 'pessimistic_write' },
                });
                if (seats.length !== seatNumbers.length) {
                    const foundSeats = seats.map((s) => s.seatNumber);
                    const unavailable = seatNumbers.filter((s) => !foundSeats.includes(s));
                    throw new business_exceptions_1.SeatUnavailableException(unavailable);
                }
                const expiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS);
                await queryRunner.manager.update(seat_entity_1.Seat, { id: (0, typeorm_2.In)(seats.map((s) => s.id)) }, {
                    status: seat_entity_1.SeatStatus.RESERVED,
                    reservedUntil: expiresAt,
                });
                const reservation = queryRunner.manager.create(reservation_entity_1.Reservation, {
                    userId,
                    sessionId,
                    seatIds: seats.map((s) => s.id),
                    expiresAt,
                    status: reservation_entity_1.ReservationStatus.PENDING,
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
                this.logger.log(`Reservation created: ${savedReservation.id} for seats ${seatNumbers.join(', ')}`);
                return savedReservation;
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        finally {
            await this.redisLock.releaseMultiple(locks);
        }
    }
    async confirmPayment(dto) {
        const { reservationId, userId } = dto;
        const reservation = await this.reservationRepository.findOne({
            where: { id: reservationId, userId },
            relations: ['session'],
        });
        if (!reservation) {
            throw new business_exceptions_1.ReservationNotFoundException(reservationId);
        }
        if (new Date() > reservation.expiresAt) {
            throw new business_exceptions_1.ReservationExpiredException(reservationId);
        }
        if (reservation.status === reservation_entity_1.ReservationStatus.CONFIRMED) {
            const existingSale = await this.saleRepository.findOne({
                where: { reservationId },
            });
            if (!existingSale) {
                throw new business_exceptions_1.ReservationNotFoundException(reservationId);
            }
            return existingSale;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.update(seat_entity_1.Seat, { id: (0, typeorm_2.In)(reservation.seatIds) }, { status: seat_entity_1.SeatStatus.SOLD, reservedUntil: undefined });
            await queryRunner.manager.update(reservation_entity_1.Reservation, { id: reservationId }, { status: reservation_entity_1.ReservationStatus.CONFIRMED });
            const session = await queryRunner.manager.findOne(session_entity_1.Session, {
                where: { id: reservation.sessionId },
            });
            if (!session) {
                throw new business_exceptions_1.SessionNotFoundException(reservation.sessionId);
            }
            const sale = queryRunner.manager.create(sale_entity_1.Sale, {
                reservationId,
                userId,
                totalAmountCents: session.priceCents * reservation.seatIds.length,
            });
            const savedSale = await queryRunner.manager.save(sale);
            await queryRunner.commitTransaction();
            await this.kafkaProducer.publish('booking.confirmed', {
                saleId: savedSale.id,
                reservationId,
                userId,
                sessionId: reservation.sessionId,
                totalAmountCents: savedSale.totalAmountCents,
            });
            this.logger.log(`Payment confirmed: ${savedSale.id}`);
            return savedSale;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getUserPurchases(userId) {
        return this.saleRepository.find({
            where: { userId },
            relations: ['reservation', 'reservation.session'],
            order: { confirmedAt: 'DESC' },
        });
    }
    generateIdempotencyKey(userId, sessionId, seatNumbers) {
        return `reserve:${userId}:${sessionId}:${seatNumbers.sort().join(',')}`;
    }
    async getReservation(id) {
        const reservation = await this.reservationRepository.findOne({
            where: { id },
            relations: ['session'],
        });
        if (!reservation) {
            throw new business_exceptions_1.ReservationNotFoundException(id);
        }
        return reservation;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(2, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __param(3, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        redis_lock_service_1.RedisLockService,
        kafka_producer_service_1.KafkaProducerService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map