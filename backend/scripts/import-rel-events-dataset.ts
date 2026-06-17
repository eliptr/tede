import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { DataSource } from 'typeorm';

import { User, UserRole, UserStatus } from '../src/entities/user.entity';
import { Event, EventStatus } from '../src/entities/event.entity';
import { EventCategory } from '../src/entities/event-category.entity';
import { TicketType } from '../src/entities/ticket-type.entity';
import { Booking } from '../src/entities/booking.entity';
import { Message } from '../src/entities/message.entity';
import { EventPhoto } from '../src/entities/event-photo.entity';
import { UserEventView } from '../src/entities/user-event-view.entity';
import {
  RecommendationInteraction,
  RecommendationInteractionSource,
} from '../src/entities/recommendation-interaction.entity';
import { UserFriend } from '../src/entities/user-friend.entity';

type CsvRow = Record<string, string>;

const backendRoot = path.resolve(__dirname, '..');
loadEnv(path.join(backendRoot, '.env'));

const datasetDir = env('DATASET_DIR', 'C:\\Users\\elipe\\Downloads\\dataset\\rel_event_csvs');
const maxUsers = envNumber('DATASET_MAX_USERS', 5000);
const maxEvents = envNumber('DATASET_MAX_EVENTS', 5000);
const maxInteractions = envNumber('DATASET_MAX_INTERACTIONS', 50000);
const maxFriends = envNumber('DATASET_MAX_FRIENDS', 20000);
const datasetPassword = env('DATASET_PASSWORD', 'Dataset1234!');

const source = new DataSource({
  type: 'mysql',
  host: env('DB_HOST', 'localhost'),
  port: envNumber('DB_PORT', 3306),
  username: env('DB_USER', 'root'),
  password: env('DB_PASSWORD', ''),
  database: env('DB_NAME', 'ted2026'),
  entities: [
    User, Event, EventCategory, TicketType, Booking, Message, EventPhoto,
    UserEventView, RecommendationInteraction, UserFriend,
  ],
  synchronize: true,
  charset: 'utf8mb4',
});

async function main() {
  await source.initialize();

  try {
    const userMap = await importUsers();
    const eventMap = await importEvents(userMap);
    const interactions = await importInteractions(userMap, eventMap);
    const friends = await importFriends(userMap);

    console.log('Dataset import complete');
    console.log(`Users: ${userMap.size}`);
    console.log(`Events: ${eventMap.size}`);
    console.log(`Recommendation interactions: ${interactions}`);
    console.log(`Friend links: ${friends}`);
    console.log(`Sample login: dataset_user_0 / ${datasetPassword}`);
  } finally {
    await source.destroy();
  }
}

async function importUsers(): Promise<Map<number, number>> {
  const repo = source.getRepository(User);
  const hash = await bcrypt.hash(datasetPassword, 10);
  const userMap = new Map<number, number>();
  let count = 0;

  for await (const row of readCsv(path.join(datasetDir, 'users.csv'))) {
    const externalId = toInt(row.user_id);
    if (externalId === undefined) continue;

    const username = `dataset_user_${externalId}`;
    let user = await repo.findOne({ where: { external_dataset_id: externalId } });

    if (!user) {
      user = repo.create({
        external_dataset_id: externalId,
        username,
        password_hash: hash,
        first_name: 'Dataset',
        last_name: `User ${externalId}`,
        email: `${username}@dataset.local`,
        phone: '0000000000',
        address: row.location || 'Dataset',
        city: row.location || 'Unknown',
        country: localeToCountry(row.locale),
        zip: '',
        afm: `DS${String(externalId).padStart(7, '0').slice(-7)}`,
        role: UserRole.ATTENDEE,
        status: UserStatus.APPROVED,
      });
    } else {
      user.username = username;
      user.status = UserStatus.APPROVED;
    }

    const saved = await repo.save(user);
    userMap.set(externalId, saved.id);
    count += 1;

    if (count >= maxUsers) break;
  }

  return userMap;
}

async function importEvents(userMap: Map<number, number>): Promise<Map<number, number>> {
  const admin = await source.getRepository(User).findOne({ where: { username: env('ADMIN_USERNAME', 'admin') } });
  if (!admin) {
    throw new Error('Admin user was not found. Start the backend once or create the admin before importing.');
  }

  const eventRepo = source.getRepository(Event);
  const categoryRepo = source.getRepository(EventCategory);
  const ticketRepo = source.getRepository(TicketType);
  const eventMap = new Map<number, number>();
  let count = 0;

  for await (const row of readCsv(path.join(datasetDir, 'events.csv'))) {
    const externalId = toInt(row.event_id);
    if (externalId === undefined) continue;

    const start = parseDate(row.start_time);
    const organizerExternalId = toInt(row.user_id);
    const organizerId =
      organizerExternalId !== undefined && userMap.has(organizerExternalId)
        ? userMap.get(organizerExternalId)
        : admin.id;

    let event = await eventRepo.findOne({ where: { external_dataset_id: externalId } });
    event = eventRepo.create({
      ...(event || {}),
      external_dataset_id: externalId,
      title: `Dataset Event ${externalId}`,
      event_type: 'DATASET',
      venue: row.city || row.state || 'Dataset venue',
      address: row.zip || row.city || 'Dataset address',
      city: row.city || 'Unknown',
      country: row.country || 'Unknown',
      latitude: toNumber(row.lat),
      longitude: toNumber(row.lng),
      start_datetime: start,
      end_datetime: new Date(start.getTime() + 2 * 60 * 60 * 1000),
      capacity: 100,
      description: 'Imported from the event recommendation dataset.',
      organizer_id: organizerId,
      status: EventStatus.PUBLISHED,
    });

    const saved = await eventRepo.save(event);
    eventMap.set(externalId, saved.id);

    await categoryRepo.delete({ event_id: saved.id });
    const categories = datasetCategories(row);
    await categoryRepo.save(categories.map((category) => ({ event_id: saved.id, category })));

    const existingTickets = await ticketRepo.find({ where: { event_id: saved.id } });
    if (existingTickets.length === 0) {
      await ticketRepo.save({
        event_id: saved.id,
        name: 'General Admission',
        price: 0,
        quantity: 100,
        available: 100,
      });
    }

    count += 1;
    if (count >= maxEvents) break;
  }

  return eventMap;
}

async function importInteractions(
  userMap: Map<number, number>,
  eventMap: Map<number, number>,
): Promise<number> {
  let imported = 0;

  imported += await importInterestInteractions(userMap, eventMap, maxInteractions);

  if (imported < maxInteractions) {
    imported += await importAttendeeInteractions(userMap, eventMap, maxInteractions - imported);
  }

  return imported;
}

async function importInterestInteractions(
  userMap: Map<number, number>,
  eventMap: Map<number, number>,
  remaining: number,
): Promise<number> {
  let count = 0;
  const rows: Partial<RecommendationInteraction>[] = [];

  for await (const row of readCsv(path.join(datasetDir, 'event_interest.csv'))) {
    const localUserId = mappedId(userMap, row.user);
    const localEventId = mappedId(eventMap, row.event);
    if (!localUserId || !localEventId) continue;

    const rating = interestRating(row);
    if (rating === undefined) continue;

    rows.push({
      user_id: localUserId,
      event_id: localEventId,
      rating,
      source: RecommendationInteractionSource.DATASET_INTEREST,
    });

    if (rows.length >= 1000) {
      count += await saveInteractions(rows);
      rows.length = 0;
      if (count >= remaining) break;
    }
  }

  if (rows.length && count < remaining) {
    count += await saveInteractions(rows);
  }

  return Math.min(count, remaining);
}

async function importAttendeeInteractions(
  userMap: Map<number, number>,
  eventMap: Map<number, number>,
  remaining: number,
): Promise<number> {
  let count = 0;
  const rows: Partial<RecommendationInteraction>[] = [];

  for await (const row of readCsv(path.join(datasetDir, 'event_attendees.csv'))) {
    const localUserId = mappedId(userMap, row.user_id);
    const localEventId = mappedId(eventMap, row.event);
    if (!localUserId || !localEventId) continue;

    const rating = attendeeRating(row.status);
    if (rating === undefined) continue;

    rows.push({
      user_id: localUserId,
      event_id: localEventId,
      rating,
      source: RecommendationInteractionSource.DATASET_ATTENDEE,
    });

    if (rows.length >= 1000) {
      count += await saveInteractions(rows);
      rows.length = 0;
      if (count >= remaining) break;
    }
  }

  if (rows.length && count < remaining) {
    count += await saveInteractions(rows);
  }

  return Math.min(count, remaining);
}

async function importFriends(userMap: Map<number, number>): Promise<number> {
  const repo = source.getRepository(UserFriend);
  let count = 0;
  const rows: Partial<UserFriend>[] = [];

  for await (const row of readCsv(path.join(datasetDir, 'user_friends.csv'))) {
    const userId = mappedId(userMap, row.user);
    const friendId = mappedId(userMap, row.friend);
    if (!userId || !friendId || userId === friendId) continue;

    rows.push({ user_id: userId, friend_id: friendId });

    if (rows.length >= 1000) {
      await repo.upsert(rows, ['user_id', 'friend_id']);
      count += rows.length;
      rows.length = 0;
      if (count >= maxFriends) break;
    }
  }

  if (rows.length && count < maxFriends) {
    await repo.upsert(rows, ['user_id', 'friend_id']);
    count += rows.length;
  }

  return Math.min(count, maxFriends);
}

async function saveInteractions(rows: Partial<RecommendationInteraction>[]) {
  await source
    .getRepository(RecommendationInteraction)
    .upsert(rows, ['user_id', 'event_id', 'source']);

  return rows.length;
}

async function* readCsv(filePath: string): AsyncGenerator<CsvRow> {
  const input = fs.createReadStream(filePath);
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let headers: string[] | undefined;

  for await (const line of lines) {
    const values = parseCsvLine(line);
    if (!headers) {
      headers = values;
      continue;
    }

    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    yield row;
  }
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function datasetCategories(row: CsvRow): string[] {
  const categories = Object.keys(row)
    .filter((key) => /^c_\d+$/.test(key))
    .map((key) => ({ key, value: toNumber(row[key]) || 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => item.key);

  if ((toNumber(row.c_other) || 0) > 0) {
    categories.push('c_other');
  }

  return categories.length ? categories : ['dataset'];
}

function interestRating(row: CsvRow): number | undefined {
  if (row.interested === '1') return 4;
  if (row.not_interested === '1') return 1;
  if (row.invited === '1') return 2;
  return undefined;
}

function attendeeRating(status: string): number | undefined {
  switch ((status || '').toLowerCase()) {
    case 'yes':
      return 5;
    case 'maybe':
      return 3.5;
    case 'invited':
      return 2.5;
    case 'no':
      return 1;
    default:
      return undefined;
  }
}

function localeToCountry(locale: string) {
  const country = locale?.split('_')[1];
  return country || 'Unknown';
}

function mappedId(map: Map<number, number>, value: string): number | undefined {
  const externalId = toInt(value);
  return externalId === undefined ? undefined : map.get(externalId);
}

function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toInt(value: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNumber(value: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function env(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function envNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equals = trimmed.indexOf('=');
    if (equals === -1) continue;

    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
