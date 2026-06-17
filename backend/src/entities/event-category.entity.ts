import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity('event_categories')
export class EventCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  category: string;

  @ManyToOne(() => Event, (e) => e.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  event_id: number;
}
