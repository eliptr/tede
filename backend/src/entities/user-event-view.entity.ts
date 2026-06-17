import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity('user_event_views')
export class UserEventView {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.event_views, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Event, (e) => e.views, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  event_id: number;

  @CreateDateColumn()
  viewed_at: Date;
}
