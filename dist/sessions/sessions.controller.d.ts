import { SessionsService } from './sessions.service';
import { CreateSessionDto } from '../dto/create-session.dto';
export declare class SessionsController {
    private sessionsService;
    constructor(sessionsService: SessionsService);
    create(dto: CreateSessionDto): Promise<import("../modules/sessions/entities/session.entity").Session>;
    findAll(): Promise<import("../modules/sessions/entities/session.entity").Session[]>;
    getAvailability(id: string): Promise<{
        session: import("../modules/sessions/entities/session.entity").Session;
        availableSeats: string[];
        reservedSeats: string[];
        soldSeats: string[];
    }>;
}
