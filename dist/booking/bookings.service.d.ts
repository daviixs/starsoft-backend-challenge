import { Repository, DataSource } from 'typeorm';
import { Reservation } from '../modules/sessions/entities/reservation.entity';
import { Sale } from '../modules/sessions/entities/sale.entity';
import { Seat } from '../modules/sessions/entities/seat.entity';
import { Session } from '../modules/sessions/entities/session.entity';
import { ReserveSeatsDto } from '../dto/reserve-seats.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { RedisLockService } from '../redis/redis-lock.service';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
export declare class BookingsService {
    private reservationRepository;
    private saleRepository;
    private seatRepository;
    private sessionRepository;
    private dataSource;
    private redisLock;
    private kafkaProducer;
    private readonly logger;
    private readonly RESERVATION_TTL_MS;
    constructor(reservationRepository: Repository<Reservation>, saleRepository: Repository<Sale>, seatRepository: Repository<Seat>, sessionRepository: Repository<Session>, dataSource: DataSource, redisLock: RedisLockService, kafkaProducer: KafkaProducerService);
    reserveSeats(dto: ReserveSeatsDto): Promise<Reservation>;
    confirmPayment(dto: ConfirmPaymentDto): Promise<Sale>;
    getUserPurchases(userId: string): Promise<Sale[]>;
    private generateIdempotencyKey;
    getReservation(id: string): Promise<Reservation>;
}
