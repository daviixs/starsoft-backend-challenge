import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'total_amount_cents', type: 'int' })
  totalAmountCents: number;

  @CreateDateColumn({ name: 'confirmed_at' })
  confirmedAt: Date;

  @ManyToOne(() => Reservation)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;
}
