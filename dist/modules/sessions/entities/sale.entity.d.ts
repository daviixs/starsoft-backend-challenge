import { Reservation } from './reservation.entity';
export declare class Sale {
    id: string;
    reservationId: string;
    userId: string;
    totalAmountCents: number;
    confirmedAt: Date;
    reservation: Reservation;
}
