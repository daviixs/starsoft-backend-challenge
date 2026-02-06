import { Session } from './session.entity';
export declare enum ReservationStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class Reservation {
    id: string;
    userId: string;
    sessionId: string;
    seatIds: string[];
    expiresAt: Date;
    status: ReservationStatus;
    createdAt: Date;
    session: Session;
}
