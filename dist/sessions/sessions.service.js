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
var SessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("../modules/sessions/entities/session.entity");
const seat_entity_1 = require("../modules/sessions/entities/seat.entity");
const business_exceptions_1 = require("../exceptions/business.exceptions");
let SessionsService = SessionsService_1 = class SessionsService {
    sessionRepository;
    seatRepository;
    dataSource;
    logger = new common_1.Logger(SessionsService_1.name);
    constructor(sessionRepository, seatRepository, dataSource) {
        this.sessionRepository = sessionRepository;
        this.seatRepository = seatRepository;
        this.dataSource = dataSource;
    }
    async createSession(dto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const session = queryRunner.manager.create(session_entity_1.Session, {
                movieName: dto.movieName,
                roomNumber: dto.roomNumber,
                startsAt: new Date(dto.startsAt),
                priceCents: dto.priceCents,
            });
            const savedSession = await queryRunner.manager.save(session);
            const seats = this.generateSeats(savedSession.id, dto.totalSeats);
            await queryRunner.manager.save(seat_entity_1.Seat, seats);
            await queryRunner.commitTransaction();
            this.logger.log(`Session created: ${savedSession.id} with ${dto.totalSeats} seats`);
            return savedSession;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Failed to create session:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getAvailability(sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new business_exceptions_1.SessionNotFoundException(sessionId);
        }
        const seats = await this.seatRepository.find({
            where: { sessionId },
        });
        return {
            session,
            availableSeats: seats
                .filter((s) => s.status === seat_entity_1.SeatStatus.AVAILABLE)
                .map((s) => s.seatNumber),
            reservedSeats: seats
                .filter((s) => s.status === seat_entity_1.SeatStatus.RESERVED)
                .map((s) => s.seatNumber),
            soldSeats: seats
                .filter((s) => s.status === seat_entity_1.SeatStatus.SOLD)
                .map((s) => s.seatNumber),
        };
    }
    async findAll() {
        return this.sessionRepository.find({
            order: { startsAt: 'ASC' },
        });
    }
    generateSeats(sessionId, total) {
        const seats = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsPerRow = Math.ceil(total / rows.length);
        let count = 0;
        for (const row of rows) {
            for (let num = 1; num <= seatsPerRow && count < total; num++) {
                seats.push({
                    sessionId,
                    seatNumber: `${row}${num}`,
                    status: seat_entity_1.SeatStatus.AVAILABLE,
                    reservedUntil: null,
                });
                count++;
            }
        }
        return seats;
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = SessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map