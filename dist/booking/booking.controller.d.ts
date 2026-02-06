import { BookingsService } from './bookings.service';
import { ReserveSeatsDto } from '../dto/reserve-seats.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
export declare class BookingsController {
    private readonly bookingsService;
    private readonly logger;
    constructor(bookingsService: BookingsService);
    reserve(dto: ReserveSeatsDto): Promise<{
        id: string;
        userId: string;
        sessionId: string;
        seatIds: string[];
        expiresAt: Date;
        status: import("../modules/sessions/entities/reservation.entity").ReservationStatus;
        message: string;
    }>;
    confirm(dto: ConfirmPaymentDto): Promise<{
        id: string;
        reservationId: string;
        userId: string;
        totalAmountCents: number;
        confirmedAt: Date;
        message: string;
    }>;
    getUserPurchases(userId: string): Promise<{
        userId: string;
        totalPurchases: number;
        purchases: {
            id: string;
            totalAmountCents: number;
            confirmedAt: Date;
            movie: string;
            startsAt: Date;
            seats: number;
        }[];
    }>;
    getReservation(id: string): Promise<{
        id: string;
        userId: string;
        sessionId: string;
        seatIds: string[];
        expiresAt: Date;
        status: import("../modules/sessions/entities/reservation.entity").ReservationStatus;
        isExpired: boolean;
        timeRemaining: number;
    }>;
}
