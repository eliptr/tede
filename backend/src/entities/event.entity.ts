import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { EventCategory } from './event-category.entity';
import { TicketType } from './ticket-type.entity';
import { Booking } from './booking.entity';
import { EventPhoto } from './event-photo.entity';
import { UserEventView } from './user-event-view.entity';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('events')
@Index(['external_dataset_id'], { unique: true })
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 100 })
  event_type: string;

  @Column({ length: 255 })
  venue: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'datetime' })
  start_datetime: Date;

  @Column({ type: 'datetime' })
  end_datetime: Date;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  external_dataset_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (u) => u.events, { eager: false })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column()
  organizer_id: number;

  @OneToMany(() => EventCategory, (c) => c.event, { cascade: true, eager: true })
  categories: EventCategory[];

  @OneToMany(() => TicketType, (t) => t.event, { cascade: true, eager: true })
  ticket_types: TicketType[];

  @OneToMany(() => Booking, (b) => b.event)
  bookings: Booking[];

  @OneToMany(() => EventPhoto, (p) => p.event, { cascade: true, eager: true })
  photos: EventPhoto[];

  @OneToMany(() => UserEventView, (v) => v.event)
  views: UserEventView[];
}
