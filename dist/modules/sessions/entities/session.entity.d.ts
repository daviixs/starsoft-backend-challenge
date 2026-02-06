import { Seat } from './seat.entity';
export declare class Session {
    id: string;
    movieName: string;
    roomNumber: number;
    startsAt: Date;
    priceCents: number;
    createdAt: Date;
    seats: Seat[];
}
