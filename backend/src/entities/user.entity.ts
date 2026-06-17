import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { Booking } from './booking.entity';
import { Message } from './message.entity';
import { UserEventView } from './user-event-view.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  ATTENDEE = 'ATTENDEE',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('users')
@Index(['external_dataset_id'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column()
  password_hash: string;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ unique: true, length: 200 })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  country: string;

  @Column({ nullable: true, length: 20 })
  zip: string;

  @Column({ nullable: true })
  external_dataset_id: number;

  @Column({ length: 20 })
  afm: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ATTENDEE })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Event, (e) => e.organizer)
  events: Event[];

  @OneToMany(() => Booking, (b) => b.attendee)
  bookings: Booking[];

  @OneToMany(() => Message, (m) => m.sender)
  sent_messages: Message[];

  @OneToMany(() => Message, (m) => m.receiver)
  received_messages: Message[];

  @OneToMany(() => UserEventView, (v) => v.user)
  event_views: UserEventView[];
}
