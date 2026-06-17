import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsInt, Min } from 'class-validator';
import { Repository, DataSource } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Event, EventStatus } from '../entities/event.entity';
import { TicketType } from '../entities/ticket-type.entity';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  event_id: number;

  @IsInt()
  @Min(1)
  ticket_type_id: number;

  @IsInt()
  @Min(1)
  number_of_tickets: number;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(TicketType) private ticketRepo: Repository<TicketType>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto, attendeeId: number): Promise<Booking> {
    const eventId = Number(dto.event_id);
    const ticketTypeId = Number(dto.ticket_type_id);
    const numberOfTickets = Number(dto.number_of_tickets);

    if (!Number.isInteger(attendeeId) || attendeeId <= 0) {
      throw new BadRequestException('Invalid attendee_id');
    }

    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new BadRequestException('Invalid event_id');
    }

    if (!Number.isInteger(ticketTypeId) || ticketTypeId <= 0) {
      throw new BadRequestException('Invalid ticket_type_id');
    }

    if (!Number.isInteger(numberOfTickets) || numberOfTickets <= 0) {
      throw new BadRequestException('Invalid number_of_tickets');
    }

    return this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(Event, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!event) throw new NotFoundException('Event not found');

      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestException('Event is not available for bookings');
      }

      if (event.organizer_id === attendeeId) {
        throw new BadRequestException('You cannot book your own event');
      }

      const ticketType = await manager.findOne(TicketType, {
        where: { id: ticketTypeId, event_id: eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ticketType) throw new NotFoundException('Ticket type not found');

      if (ticketType.available < numberOfTickets) {
        throw new BadRequestException(
          `Only ${ticketType.available} tickets available for this type`,
        );
      }

      const totalBooked = await manager
        .createQueryBuilder(Booking, 'b')
        .select('SUM(b.number_of_tickets)', 'total')
        .where('b.event_id = :eid AND b.status != :status', {
          eid: eventId,
          status: BookingStatus.CANCELLED,
        })
        .getRawOne();

      const alreadyBooked = Number(totalBooked?.total ?? 0);

      if (alreadyBooked + numberOfTickets > event.capacity) {
        throw new BadRequestException('Not enough total capacity available');
      }

      ticketType.available -= numberOfTickets;
      await manager.save(ticketType);

      const totalCost = Number(ticketType.price) * numberOfTickets;

      if (!Number.isFinite(totalCost)) {
        throw new BadRequestException('Invalid ticket price or ticket quantity');
      }

      const booking = manager.create(Booking, {
        attendee_id: attendeeId,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        number_of_tickets: numberOfTickets,
        total_cost: totalCost,
        status: BookingStatus.CONFIRMED,
      });

      return manager.save(booking);
    });
  }

  async findByUser(userId: number) {
    const bookings = await this.bookingRepo.find({
      where: { attendee_id: userId },
      relations: ['event', 'event.categories', 'event.photos', 'ticket_type'],
      order: { time: 'DESC' },
    });

    return bookings.map((booking) => ({
      ...booking,
      status: booking.event?.status === EventStatus.CANCELLED
        ? BookingStatus.CANCELLED
        : booking.status,
    }));
  }

  async findOne(id: number, userId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id, attendee_id: userId },
      relations: ['event', 'ticket_type', 'attendee'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return {
      ...booking,
      status: booking.event?.status === EventStatus.CANCELLED
        ? BookingStatus.CANCELLED
        : booking.status,
    };
  }
}
