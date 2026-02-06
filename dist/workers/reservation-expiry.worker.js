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
var ReservationExpiryWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationExpiryWorker = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const reservation_entity_1 = require("../modules/sessions/entities/reservation.entity");
const seat_entity_1 = require("../modules/sessions/entities/seat.entity");
const kafka_producer_service_1 = require("../kafka/kafka.producer.service");
const kafka_consumer_service_1 = require("../kafka/kafka-consumer.service");
let ReservationExpiryWorker = ReservationExpiryWorker_1 = class ReservationExpiryWorker {
    reservationRepository;
    seatRepository;
    dataSource;
    kafkaProducer;
    kafkaConsumer;
    logger = new common_1.Logger(ReservationExpiryWorker_1.name);
    constructor(reservationRepository, seatRepository, dataSource, kafkaProducer, kafkaConsumer) {
        this.reservationRepository = reservationRepository;
        this.seatRepository = seatRepository;
        this.dataSource = dataSource;
        this.kafkaProducer = kafkaProducer;
        this.kafkaConsumer = kafkaConsumer;
    }
    async onModuleInit() {
        await this.kafkaConsumer.subscribe('booking.reserved', 'expiry-worker-group', this.handleReservationCreated.bind(this));
        this.logger.log('Reservation expiry worker initialized');
    }
    async checkExpiredReservations() {
        this.logger.debug('Running expiry check...');
        try {
            const expired = await this.reservationRepository.find({
                where: {
                    status: reservation_entity_1.ReservationStatus.PENDING,
                    expiresAt: (0, typeorm_2.LessThan)(new Date()),
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
        }
        catch (error) {
            this.logger.error('Error checking expired reservations:', error);
        }
    }
    async expireReservation(reservation) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.update(seat_entity_1.Seat, { id: (0, typeorm_2.In)(reservation.seatIds) }, {
                status: seat_entity_1.SeatStatus.AVAILABLE,
                reservedUntil: undefined,
            });
            await queryRunner.manager.update(reservation_entity_1.Reservation, { id: reservation.id }, { status: reservation_entity_1.ReservationStatus.EXPIRED });
            await queryRunner.commitTransaction();
            await this.kafkaProducer.publish('booking.expired', {
                reservationId: reservation.id,
                userId: reservation.userId,
                sessionId: reservation.sessionId,
                seatIds: reservation.seatIds,
                expiredAt: new Date().toISOString(),
            });
            this.logger.log(`Reservation expired: ${reservation.id}`);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to expire reservation ${reservation.id}:`, error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async handleReservationCreated(data) {
        this.logger.debug(`Received reservation created event: ${data.reservationId}`);
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();
        const delayMs = expiresAt.getTime() - now.getTime();
        if (delayMs > 0) {
            setTimeout(async () => {
                this.logger.debug(`Checking reservation ${data.reservationId} for expiration`);
                const reservation = await this.reservationRepository.findOne({
                    where: { id: data.reservationId },
                });
                if (reservation &&
                    reservation.status === reservation_entity_1.ReservationStatus.PENDING &&
                    new Date() > reservation.expiresAt) {
                    await this.expireReservation(reservation);
                }
            }, delayMs + 1000);
        }
    }
    async forceExpireReservation(reservationId) {
        const reservation = await this.reservationRepository.findOne({
            where: { id: reservationId },
        });
        if (!reservation) {
            throw new Error(`Reservation ${reservationId} not found`);
        }
        if (reservation.status !== reservation_entity_1.ReservationStatus.PENDING) {
            throw new Error(`Reservation ${reservationId} is not in pending status`);
        }
        await this.expireReservation(reservation);
    }
};
exports.ReservationExpiryWorker = ReservationExpiryWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservationExpiryWorker.prototype, "checkExpiredReservations", null);
exports.ReservationExpiryWorker = ReservationExpiryWorker = ReservationExpiryWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        kafka_producer_service_1.KafkaProducerService,
        kafka_consumer_service_1.KafkaConsumerService])
], ReservationExpiryWorker);
//# sourceMappingURL=reservation-expiry.worker.js.map