import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../entities/booking.entity';
import { Event } from '../entities/event.entity';
import { TicketType } from '../entities/ticket-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Event, TicketType])],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
