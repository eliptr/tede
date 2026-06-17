import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Event } from './event.entity';
import { Booking } from './booking.entity';

@Entity('ticket_types')
export class TicketType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  available: number;

  @ManyToOne(() => Event, (e) => e.ticket_types, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  event_id: number;

  @OneToMany(() => Booking, (b) => b.ticket_type)
  bookings: Booking[];
}
