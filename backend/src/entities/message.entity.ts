import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.sent_messages, { eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  sender_id: number;

  @ManyToOne(() => User, (u) => u.received_messages, { eager: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column()
  receiver_id: number;

  @Column({ nullable: true })
  booking_id: number;

  @Column({ nullable: true })
  event_id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  sent_at: Date;

  @Column({ type: 'datetime', nullable: true })
  read_at: Date;

  @Column({ default: false })
  deleted_by_sender: boolean;

  @Column({ default: false })
  deleted_by_receiver: boolean;
}
