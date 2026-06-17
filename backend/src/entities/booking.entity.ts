import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { TicketType } from './ticket-type.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.bookings, { eager: false })
  @JoinColumn({ name: 'attendee_id' })
  attendee: User;

  @Column()
  attendee_id: number;

  @ManyToOne(() => Event, (e) => e.bookings, { eager: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  event_id: number;

  @ManyToOne(() => TicketType, (t) => t.bookings, { eager: true })
  @JoinColumn({ name: 'ticket_type_id' })
  ticket_type: TicketType;

  @Column()
  ticket_type_id: number;

  @CreateDateColumn()
  time: Date;

  @Column({ type: 'int' })
  number_of_tickets: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_cost: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;
}
