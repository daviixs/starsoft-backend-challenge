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
var ReserveSeatsUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReserveSeatsUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redis_lock_service_1 = require("../../redis/redis-lock.service");
const kafka_producer_service_1 = require("../../kafka/kafka.producer.service");
const reservation_entity_1 = require("../../modules/sessions/entities/reservation.entity");
const seat_entity_1 = require("../../modules/sessions/entities/seat.entity");
const session_entity_1 = require("../../modules/sessions/entities/session.entity");
const business_exceptions_1 = require("../../exceptions/business.exceptions");
let ReserveSeatsUseCase = ReserveSeatsUseCase_1 = class ReserveSeatsUseCase {
    seatRepository;
    sessionRepository;
    dataSource;
    redisLock;
    kafkaProducer;
    logger = new common_1.Logger(ReserveSeatsUseCase_1.name);
    RESERVATION_TTL_MS = 30000;
    constructor(seatRepository, sessionRepository, dataSource, redisLock, kafkaProducer) {
        this.seatRepository = seatRepository;
        this.sessionRepository = sessionRepository;
        this.dataSource = dataSource;
        this.redisLock = redisLock;
        this.kafkaProducer = kafkaProducer;
    }
    async execute(dto) {
        const { userId, sessionId, seatNumbers } = dto;
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new business_exceptions_1.SessionNotFoundException(sessionId);
        }
        const idempotencyKey = this.buildIdempotencyKey(userId, sessionId, seatNumbers);
        const cached = await this.checkCache(idempotencyKey);
        if (cached)
            return cached;
        const locks = await this.acquireLocks(sessionId, seatNumbers);
        if (!locks) {
            throw new business_exceptions_1.SeatUnavailableException(seatNumbers);
        }
        try {
            const reservation = await this.createReservation(dto);
            await this.publishEvent(reservation);
            await this.cacheResult(idempotencyKey, reservation);
            return reservation;
        }
        finally {
            await this.redisLock.releaseMultiple(locks);
        }
    }
    async createReservation(dto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const seats = await queryRunner.manager.find(seat_entity_1.Seat, {
                where: {
                    sessionId: dto.sessionId,
                    seatNumber: (0, typeorm_2.In)(dto.seatNumbers),
                    status: seat_entity_1.SeatStatus.AVAILABLE,
                },
                lock: { mode: 'pessimistic_write' },
            });
            if (seats.length !== dto.seatNumbers.length) {
                const found = seats.map((s) => s.seatNumber);
                const unavailable = dto.seatNumbers.filter((s) => !found.includes(s));
                throw new business_exceptions_1.SeatUnavailableException(unavailable);
            }
            const expiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS);
            await queryRunner.manager.update(seat_entity_1.Seat, { id: (0, typeorm_2.In)(seats.map((s) => s.id)) }, {
                status: seat_entity_1.SeatStatus.RESERVED,
                reservedUntil: expiresAt,
            });
            const reservation = queryRunner.manager.create(reservation_entity_1.Reservation, {
                userId: dto.userId,
                sessionId: dto.sessionId,
                seatIds: seats.map((s) => s.id),
                expiresAt,
                status: reservation_entity_1.ReservationStatus.PENDING,
            });
            const savedReservation = await queryRunner.manager.save(reservation);
            await queryRunner.commitTransaction();
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
    buildIdempotencyKey(userId, sessionId, seatNumbers) {
        return `reserve:${userId}:${sessionId}:${seatNumbers.sort().join(',')}`;
    }
    async acquireLocks(sessionId, seatNumbers) {
        const lockKeys = seatNumbers
            .sort()
            .map((seat) => `seat:lock:${sessionId}:${seat}`);
        return this.redisLock.acquireMultiple(lockKeys, 5000);
    }
    async checkCache(key) {
        return this.redisLock.getCache(key);
    }
    async cacheResult(key, reservation) {
        await this.redisLock.setCache(key, reservation, 30);
    }
    async publishEvent(reservation) {
        await this.kafkaProducer.publish('booking.reserved', {
            reservationId: reservation.id,
            userId: reservation.userId,
            sessionId: reservation.sessionId,
            seatIds: reservation.seatIds,
            expiresAt: reservation.expiresAt.toISOString(),
        });
    }
};
exports.ReserveSeatsUseCase = ReserveSeatsUseCase;
exports.ReserveSeatsUseCase = ReserveSeatsUseCase = ReserveSeatsUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        redis_lock_service_1.RedisLockService,
        kafka_producer_service_1.KafkaProducerService])
], ReserveSeatsUseCase);
//# sourceMappingURL=reserve-seats.use-case.js.map