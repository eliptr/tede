import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../entities/event.entity';
import { EventCategory } from '../entities/event-category.entity';
import { TicketType } from '../entities/ticket-type.entity';
import { Booking } from '../entities/booking.entity';
import { UserEventView } from '../entities/user-event-view.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventCategory, TicketType, Booking, UserEventView])],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
