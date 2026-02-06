import { Repository, DataSource } from 'typeorm';
import { Session } from '../modules/sessions/entities/session.entity';
import { Seat } from '../modules/sessions/entities/seat.entity';
import { CreateSessionDto } from '../dto/create-session.dto';
export declare class SessionsService {
    private sessionRepository;
    private seatRepository;
    private dataSource;
    private readonly logger;
    constructor(sessionRepository: Repository<Session>, seatRepository: Repository<Seat>, dataSource: DataSource);
    createSession(dto: CreateSessionDto): Promise<Session>;
    getAvailability(sessionId: string): Promise<{
        session: Session;
        availableSeats: string[];
        reservedSeats: string[];
        soldSeats: string[];
    }>;
    findAll(): Promise<Session[]>;
    private generateSeats;
}
