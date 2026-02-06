import { Repository, DataSource } from 'typeorm';
import { RedisLockService } from '../../redis/redis-lock.service';
import { KafkaProducerService } from '../../kafka/kafka.producer.service';
import { ReserveSeatsDto } from '../../dto/reserve-seats.dto';
import { Reservation } from '../../modules/sessions/entities/reservation.entity';
import { Seat } from '../../modules/sessions/entities/seat.entity';
import { Session } from '../../modules/sessions/entities/session.entity';
export declare class ReserveSeatsUseCase {
    private readonly seatRepository;
    private readonly sessionRepository;
    private readonly dataSource;
    private readonly redisLock;
    private readonly kafkaProducer;
    private readonly logger;
    private readonly RESERVATION_TTL_MS;
    constructor(seatRepository: Repository<Seat>, sessionRepository: Repository<Session>, dataSource: DataSource, redisLock: RedisLockService, kafkaProducer: KafkaProducerService);
    execute(dto: ReserveSeatsDto): Promise<Reservation>;
    private createReservation;
    private buildIdempotencyKey;
    private acquireLocks;
    private checkCache;
    private cacheResult;
    private publishEvent;
}
