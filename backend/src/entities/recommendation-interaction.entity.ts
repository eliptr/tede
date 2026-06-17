import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';

export enum RecommendationInteractionSource {
  BOOKING = 'BOOKING',
  VIEW = 'VIEW',
  DATASET_INTEREST = 'DATASET_INTEREST',
  DATASET_ATTENDEE = 'DATASET_ATTENDEE',
}

@Entity('recommendation_interactions')
@Index(['user_id', 'event_id', 'source'], { unique: true })
export class RecommendationInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  event_id: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  rating: number;

  @Column({
    type: 'enum',
    enum: RecommendationInteractionSource,
  })
  source: RecommendationInteractionSource;

  @CreateDateColumn()
  created_at: Date;
}
