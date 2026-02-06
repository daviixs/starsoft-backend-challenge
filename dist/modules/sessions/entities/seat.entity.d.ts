import { Session } from './session.entity';
export declare enum SeatStatus {
    AVAILABLE = "available",
    RESERVED = "reserved",
    SOLD = "sold"
}
export declare class Seat {
    id: string;
    sessionId: string;
    seatNumber: string;
    status: SeatStatus;
    reservedUntil: Date;
    createdAt: Date;
    session: Session;
}
