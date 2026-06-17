import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Booking } from '../entities/booking.entity';
import * as xml2js from 'xml2js';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Event) private eventsRepo: Repository<Event>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  private async getEventsWithAll() {
    return this.eventsRepo.find({
      relations: ['categories', 'ticket_types', 'bookings', 'bookings.attendee', 'organizer', 'photos'],
      order: { created_at: 'DESC' },
    });
  }

  async exportJson() {
    const events = await this.getEventsWithAll();
    return events.map((e) => this.mapEventToJson(e));
  }

  async exportXml(): Promise<string> {
    const events = await this.getEventsWithAll();
    const mapped = events.map((e) => this.mapEventToXmlObj(e));

    const builder = new xml2js.Builder({
      rootName: 'Events',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });
    return builder.buildObject({ Event: mapped });
  }

  private mapEventToJson(e: Event) {
    return {
      EventID: `EV${e.id}`,
      Title: e.title,
      Categories: e.categories.map((c) => c.category),
      EventType: e.event_type,
      Venue: e.venue,
      Address: e.address,
      City: e.city,
      Country: e.country,
      GeoLocation: e.latitude ? { Latitude: e.latitude, Longitude: e.longitude } : null,
      StartDateTime: e.start_datetime,
      EndDateTime: e.end_datetime,
      Capacity: e.capacity,
      Status: e.status,
      Description: e.description,
      Organizer: { UserID: e.organizer?.username },
      TicketTypes: e.ticket_types.map((t) => ({
        TicketTypeID: `T${t.id}`,
        Name: t.name,
        Price: t.price,
        Quantity: t.quantity,
        Available: t.available,
      })),
      Bookings: e.bookings.map((b) => ({
        BookingID: `B${b.id}`,
        Attendee: { UserID: b.attendee?.username },
        Time: b.time,
        TicketTypeRef: `T${b.ticket_type_id}`,
        NumberOfTickets: b.number_of_tickets,
        TotalCost: b.total_cost,
        BookingStatus: b.status,
      })),
      Media: e.photos.map((p) => p.filename),
    };
  }

  private mapEventToXmlObj(e: Event) {
    return {
      $: { EventID: `EV${e.id}` },
      Title: e.title,
      Category: e.categories.map((c) => c.category),
      EventType: e.event_type,
      Venue: e.venue,
      Address: e.address,
      City: e.city,
      Country: e.country,
      ...(e.latitude ? { GeoLocation: [{ $: { Latitude: e.latitude, Longitude: e.longitude } }] } : {}),
      StartDateTime: e.start_datetime?.toISOString(),
      EndDateTime: e.end_datetime?.toISOString(),
      Capacity: e.capacity,
      Status: e.status,
      Description: e.description,
      Organizer: [{ $: { UserID: e.organizer?.username ?? '' } }],
      TicketTypes: [
        {
          TicketType: e.ticket_types.map((t) => ({
            $: { TicketTypeID: `T${t.id}` },
            Name: t.name,
            Price: t.price,
            Quantity: t.quantity,
            Available: t.available,
          })),
        },
      ],
      Bookings: [
        {
          Booking: e.bookings.map((b) => ({
            $: { BookingID: `B${b.id}` },
            Attendee: [{ $: { UserID: b.attendee?.username ?? '' } }],
            Time: b.time?.toISOString(),
            TicketTypeRef: `T${b.ticket_type_id}`,
            NumberOfTickets: b.number_of_tickets,
            TotalCost: b.total_cost,
            BookingStatus: b.status,
          })),
        },
      ],
      ...(e.photos.length > 0 ? { Media: [{ Photo: e.photos.map((p) => p.filename) }] } : {}),
    };
  }
}
