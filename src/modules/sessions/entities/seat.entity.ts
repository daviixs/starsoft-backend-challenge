import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Session } from './session.entity';

export enum SeatStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
}

@Entity('seats')
@Index(['sessionId', 'status'])
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'seat_number', length: 10 })
  seatNumber: string;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column({ name: 'reserved_until', type: 'timestamp', nullable: true })
  reservedUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Session, (session) => session.seats)
  @JoinColumn({ name: 'session_id' })
  session: Session;
}
