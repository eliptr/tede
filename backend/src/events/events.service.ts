import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Event, EventStatus } from '../entities/event.entity';
import { EventCategory } from '../entities/event-category.entity';
import { TicketType } from '../entities/ticket-type.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { UserEventView } from '../entities/user-event-view.entity';
import { Message } from '../entities/message.entity';
import { CreateEventDto, UpdateEventDto, EventFilterDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepo: Repository<Event>,
    @InjectRepository(EventCategory) private catRepo: Repository<EventCategory>,
    @InjectRepository(TicketType) private ticketRepo: Repository<TicketType>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(UserEventView) private viewRepo: Repository<UserEventView>,
    private dataSource: DataSource,
  ) {}

  private validateCapacity(capacity: number, ticketTypes: { quantity: number }[]) {
    const total = ticketTypes.reduce((s, t) => s + Number(t.quantity), 0);
    if (total > capacity) {
      throw new BadRequestException(
        `Total ticket quantity (${total}) exceeds event capacity (${capacity})`,
      );
    }
  }

  async create(dto: CreateEventDto, organizerId: number): Promise<Event> {
    this.validateCapacity(dto.capacity, dto.ticket_types);

    return this.dataSource.transaction(async (manager) => {
      const event = manager.create(Event, {
        title: dto.title,
        event_type: dto.event_type,
        venue: dto.venue,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        start_datetime: new Date(dto.start_datetime),
        end_datetime: new Date(dto.end_datetime),
        capacity: dto.capacity,
        description: dto.description,
        organizer_id: organizerId,
        status: EventStatus.DRAFT,
      });
      const saved = await manager.save(event);

      for (const cat of dto.categories) {
        await manager.save(EventCategory, { event_id: saved.id, category: cat });
      }

      for (const tt of dto.ticket_types) {
        await manager.save(TicketType, {
          event_id: saved.id,
          name: tt.name,
          price: tt.price,
          quantity: tt.quantity,
          available: tt.quantity,
        });
      }

      return manager.findOne(Event, {
        where: { id: saved.id },
        relations: ['categories', 'ticket_types', 'photos'],
      });
    });
  }

  async findAll(filter: EventFilterDto) {
    const page = Math.max(Number(filter.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filter.limit) || 12, 1), 100);
    const title = this.cleanText(filter.title);
    const description = this.cleanText(filter.description);
    const category = this.cleanText(filter.category);
    const city = this.cleanText(filter.city);
    const dateFrom = this.cleanDate(filter.date_from);
    const dateTo = this.cleanDate(filter.date_to, true);
    const priceMin = this.cleanNumber(filter.price_min);
    const priceMax = this.cleanNumber(filter.price_max);

    const qb = this.eventsRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.categories', 'cat')
      .leftJoinAndSelect('event.ticket_types', 'tt')
      .leftJoinAndSelect('event.photos', 'photo')
      .leftJoinAndSelect('event.organizer', 'org')
      .where('event.status = :status', { status: EventStatus.PUBLISHED });

    if (category) {
      qb.andWhere('LOWER(cat.category) LIKE :category', { category: `%${category}%` });
    }

    if (title) {
      qb.andWhere('event.title LIKE :title', { title: `%${title}%` });
    }

    if (description) {
      qb.andWhere(
        '(LOWER(event.title) LIKE :description OR LOWER(event.description) LIKE :description OR LOWER(event.event_type) LIKE :description)',
        { description: `%${description}%` },
      );
    }

    if (city) {
      qb.andWhere('LOWER(event.city) LIKE :city', { city: `%${city}%` });
    }

    if (dateFrom) {
      qb.andWhere('event.start_datetime >= :from', { from: dateFrom });
    }

    if (dateTo) {
      qb.andWhere('event.start_datetime <= :to', { to: dateTo });
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      if (priceMin !== undefined) {
        qb.andWhere('tt.price >= :priceMin', { priceMin });
      }

      if (priceMax !== undefined) {
        qb.andWhere('tt.price <= :priceMax', { priceMax });
      }
    }

    const [events, total] = await qb
      .orderBy('event.start_datetime', 'ASC')
      .addOrderBy('event.title', 'ASC')
      .distinct(true)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { events, total, page, limit };
  }

  private cleanText(value?: string) {
    const text = String(value ?? '').trim().toLowerCase();
    return text || undefined;
  }

  private cleanNumber(value?: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private cleanDate(value?: string, endOfDay = false) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;

    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  async findOne(id: number, userId?: number): Promise<Event> {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['categories', 'ticket_types', 'photos', 'organizer'],
    });
    if (!event) throw new NotFoundException('Event not found');

    // Track view for recommendations
    if (userId) {
      const existing = await this.viewRepo.findOne({ where: { user_id: userId, event_id: id } });
      if (!existing) {
        await this.viewRepo.save({ user_id: userId, event_id: id });
      }
    }

    return event;
  }

  async findByOrganizer(organizerId: number, page = 1, limit = 10) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const [events, total] = await this.eventsRepo.findAndCount({
      where: { organizer_id: organizerId },
      relations: ['categories', 'ticket_types', 'photos'],
      order: { created_at: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return { events, total, page: safePage, limit: safeLimit };
  }

  async publish(id: number, organizerId: number) {
    const event = await this.getOrganizerEvent(id, organizerId);
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT events can be published');
    }
    event.status = EventStatus.PUBLISHED;
    return this.eventsRepo.save(event);
  }

  async update(id: number, dto: UpdateEventDto, organizerId: number) {
    const event = await this.getOrganizerEvent(id, organizerId);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled event');
    }

    if (dto.ticket_types && dto.capacity) {
      this.validateCapacity(dto.capacity, dto.ticket_types);
    } else if (dto.ticket_types) {
      this.validateCapacity(event.capacity, dto.ticket_types);
    }

    return this.dataSource.transaction(async (manager) => {
      Object.assign(event, {
        title: dto.title ?? event.title,
        event_type: dto.event_type ?? event.event_type,
        venue: dto.venue ?? event.venue,
        address: dto.address ?? event.address,
        city: dto.city ?? event.city,
        country: dto.country ?? event.country,
        latitude: dto.latitude ?? event.latitude,
        longitude: dto.longitude ?? event.longitude,
        start_datetime: dto.start_datetime ? new Date(dto.start_datetime) : event.start_datetime,
        end_datetime: dto.end_datetime ? new Date(dto.end_datetime) : event.end_datetime,
        capacity: dto.capacity ?? event.capacity,
        description: dto.description ?? event.description,
      });
      await manager.save(event);

      if (dto.categories) {
        await manager.delete(EventCategory, { event_id: id });
        for (const cat of dto.categories) {
          await manager.save(EventCategory, { event_id: id, category: cat });
        }
      }

      if (dto.ticket_types) {
        await manager.delete(TicketType, { event_id: id });
        for (const tt of dto.ticket_types) {
          await manager.save(TicketType, {
            event_id: id, name: tt.name, price: tt.price,
            quantity: tt.quantity, available: tt.quantity,
          });
        }
      }

      return manager.findOne(Event, { where: { id }, relations: ['categories', 'ticket_types', 'photos'] });
    });
  }

  async cancel(id: number, organizerId: number) {
    const event = await this.getOrganizerEvent(id, organizerId);
    if (event.status === EventStatus.DRAFT || event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Can only cancel PUBLISHED events');
    }

    return this.dataSource.transaction(async (manager) => {
      event.status = EventStatus.CANCELLED;
      const savedEvent = await manager.save(event);

      const bookings = await manager.find(Booking, {
        where: { event_id: id },
      });

      const activeBookings = bookings.filter((booking) => booking.status !== BookingStatus.CANCELLED);
      const receiverIds = [...new Set(activeBookings.map((booking) => booking.attendee_id))]
        .filter((receiverId) => receiverId !== event.organizer_id);

      if (activeBookings.length > 0) {
        await manager.update(
          Booking,
          activeBookings.map((booking) => booking.id),
          { status: BookingStatus.CANCELLED },
        );
      }

      if (receiverIds.length > 0) {
        const content =
          `Η εκδήλωση "${event.title}" ακυρώθηκε. ` +
          'Η κράτησή σας έχει ενημερωθεί ως CANCELLED.';

        const messages = receiverIds.map((receiverId) =>
          manager.create(Message, {
            sender_id: event.organizer_id,
            receiver_id: receiverId,
            event_id: event.id,
            content,
          }),
        );

        await manager.save(Message, messages);
      }

      return savedEvent;
    });
  }

  async delete(id: number, organizerId: number) {
    const event = await this.getOrganizerEvent(id, organizerId);
    const hasBookings = await this.bookingRepo.count({ where: { event_id: id } });
    if (event.status !== EventStatus.DRAFT || hasBookings > 0) {
      throw new BadRequestException('Can only delete DRAFT events with no bookings');
    }
    await this.eventsRepo.remove(event);
    return { message: 'Event deleted' };
  }

  async addPhoto(eventId: number, organizerId: number, filename: string) {
    const event = await this.getOrganizerEvent(eventId, organizerId);
    // Import EventPhoto inline to avoid circular dep
    const { EventPhoto } = require('../entities/event-photo.entity');
    const repo = this.dataSource.getRepository(EventPhoto);
    return repo.save({ event_id: eventId, filename });
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.catRepo
      .createQueryBuilder('cat')
      .select('DISTINCT cat.category', 'category')
      .getRawMany();
    return rows.map((r) => r.category);
  }

  async getEventBookings(eventId: number, organizerId: number, page = 1, limit = 10) {
    const event = await this.getOrganizerEvent(eventId, organizerId);
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const [bookings, total] = await this.bookingRepo.findAndCount({
      where: { event_id: eventId },
      relations: ['attendee', 'ticket_type'],
      order: { time: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return { bookings, total, page: safePage, limit: safeLimit };
  }

  private async getOrganizerEvent(id: number, organizerId: number) {
    const event = await this.eventsRepo.findOne({
      where: { id, organizer_id: organizerId },
      relations: ['categories', 'ticket_types', 'photos'],
    });
    if (!event) throw new NotFoundException('Event not found or access denied');
    return event;
  }

  async findAllForAdmin() {
    return this.eventsRepo.find({
      relations: ['categories', 'ticket_types', 'bookings', 'organizer', 'photos'],
      order: { created_at: 'DESC' },
    });
  }
}
