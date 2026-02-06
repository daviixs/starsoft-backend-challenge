import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Seat } from './seat.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'movie_name', length: 255 })
  movieName: string;

  @Column({ name: 'room_number', type: 'int' })
  roomNumber: number;

  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt: Date;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Seat, (seat) => seat.session, { cascade: true })
  seats: Seat[];
}
