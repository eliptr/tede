import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { UserEventView } from '../entities/user-event-view.entity';
import { Event, EventStatus } from '../entities/event.entity';
import { RecommendationInteraction } from '../entities/recommendation-interaction.entity';

export interface RecommendationsPage {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Biased Matrix Factorization (BMF) Recommender System
 * Implemented from scratch.
 *
 * Model: r̂(u,i) = μ + b_u + b_i + p_u · q_i
 *   μ   = global mean rating
 *   b_u = user bias
 *   b_i = item (event) bias
 *   p_u = user latent factor vector (K-dim)
 *   q_i = item latent factor vector (K-dim)
 *
 * Ratings: booking = 5, view only = 2, imported dataset interactions = 1..5
 * Training: SGD with L2 regularization
 */
@Injectable()
export class RecommendationsService {
  private readonly K = 10;
  private readonly LR = 0.005;
  private readonly REG = 0.02;
  private readonly EPOCHS = 30;

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(UserEventView) private viewRepo: Repository<UserEventView>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(RecommendationInteraction)
    private interactionRepo: Repository<RecommendationInteraction>,
  ) {}

  async getRecommendations(userId: number, page = 1, limit = 6): Promise<RecommendationsPage> {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 50);

    const importedInteractions = await this.interactionRepo.find({
      select: ['user_id', 'event_id', 'rating'],
    });

    const bookings = await this.bookingRepo.find({
      select: ['attendee_id', 'event_id'],
    });

    const views = await this.viewRepo.find({
      select: ['user_id', 'event_id'],
    });

    const ratingsMap = new Map<string, number>();

    for (const interaction of importedInteractions) {
      const rating = Number(interaction.rating);
      if (Number.isFinite(rating)) {
        ratingsMap.set(`${interaction.user_id}:${interaction.event_id}`, rating);
      }
    }

    for (const v of views) {
      ratingsMap.set(`${v.user_id}:${v.event_id}`, 2);
    }

    for (const b of bookings) {
      ratingsMap.set(`${b.attendee_id}:${b.event_id}`, 5);
    }

    if (ratingsMap.size === 0) {
      return this.getPopular(userId, safePage, safeLimit);
    }

    const userIds = [
      ...new Set([...ratingsMap.keys()].map((k) => Number(k.split(':')[0]))),
    ];

    const itemIds = [
      ...new Set([...ratingsMap.keys()].map((k) => Number(k.split(':')[1]))),
    ];

    if (!userIds.includes(userId)) {
      return this.getPopular(userId, safePage, safeLimit);
    }

    const userIdx = new Map(userIds.map((id, i) => [id, i]));
    const itemIdx = new Map(itemIds.map((id, i) => [id, i]));

    const U = userIds.length;
    const I = itemIds.length;

    const ratings: { u: number; i: number; r: number }[] = [];

    for (const [key, r] of ratingsMap.entries()) {
      const [uid, iid] = key.split(':').map(Number);

      const u = userIdx.get(uid);
      const i = itemIdx.get(iid);

      if (u !== undefined && i !== undefined) {
        ratings.push({ u, i, r });
      }
    }

    const allR = ratings.map((x) => x.r);
    const mu = allR.reduce((a, b) => a + b, 0) / allR.length;

    const bu = new Float64Array(U);
    const bi = new Float64Array(I);
    const P = this.randMatrix(U, this.K, 0.1);
    const Q = this.randMatrix(I, this.K, 0.1);

    for (let epoch = 0; epoch < this.EPOCHS; epoch++) {
      this.shuffle(ratings);

      for (const { u, i, r } of ratings) {
        const pred = mu + bu[u] + bi[i] + this.dot(P[u], Q[i]);
        const err = r - pred;

        bu[u] += this.LR * (err - this.REG * bu[u]);
        bi[i] += this.LR * (err - this.REG * bi[i]);

        for (let k = 0; k < this.K; k++) {
          const pu = P[u][k];
          const qi = Q[i][k];

          P[u][k] += this.LR * (err * qi - this.REG * pu);
          Q[i][k] += this.LR * (err * pu - this.REG * qi);
        }
      }
    }

    const currentUserIndex = userIdx.get(userId);

    if (currentUserIndex === undefined) {
      return this.getPopular(userId, safePage, safeLimit);
    }

    const userInteracted = new Set(
      ratings
        .filter((r) => r.u === currentUserIndex)
        .map((r) => itemIds[r.i]),
    );

    const scores: { eventId: number; score: number }[] = [];

    for (let i = 0; i < I; i++) {
      const eventId = itemIds[i];

      if (userInteracted.has(eventId)) {
        continue;
      }

      const score =
        mu + bu[currentUserIndex] + bi[i] + this.dot(P[currentUserIndex], Q[i]);

      scores.push({ eventId, score });
    }

    scores.sort((a, b) => b.score - a.score);

    const scoredIds = scores.map((s) => s.eventId);

    if (scoredIds.length === 0) {
      return this.getPopular(userId, safePage, safeLimit);
    }

    const events = await this.eventRepo.find({
      where: {
        id: In(scoredIds),
        status: EventStatus.PUBLISHED,
      },
      relations: ['categories', 'ticket_types', 'photos'],
    });

    const orderedEvents = scoredIds
      .map((id) => events.find((e) => e.id === id))
      .filter((event): event is Event => Boolean(event));

    if (orderedEvents.length === 0) {
      return this.getPopular(userId, safePage, safeLimit);
    }

    const start = (safePage - 1) * safeLimit;

    return {
      events: orderedEvents.slice(start, start + safeLimit),
      total: orderedEvents.length,
      page: safePage,
      limit: safeLimit,
    };
  }

  private async getPopular(userId: number, page: number, limit: number): Promise<RecommendationsPage> {
    const total = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.organizer_id != :uid', { uid: userId })
      .getCount();

    const rows = await this.eventRepo
      .createQueryBuilder('event')
      .select('event.id', 'id')
      .leftJoin('event.bookings', 'b')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.organizer_id != :uid', { uid: userId })
      .groupBy('event.id')
      .orderBy('COUNT(b.id)', 'DESC')
      .addOrderBy('event.start_datetime', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const ids = rows.map((row) => Number(row.id)).filter(Number.isFinite);

    if (ids.length === 0) {
      return { events: [], total, page, limit };
    }

    const events = await this.eventRepo.find({
      where: { id: In(ids), status: EventStatus.PUBLISHED },
      relations: ['categories', 'ticket_types', 'photos'],
    });

    const eventsPage = ids
      .map((id) => events.find((event) => event.id === id))
      .filter((event): event is Event => Boolean(event));

    return { events: eventsPage, total, page, limit };
  }

  private randMatrix(rows: number, cols: number, scale: number): number[][] {
    const m: number[][] = [];

    for (let i = 0; i < rows; i++) {
      m.push(Array.from({ length: cols }, () => (Math.random() - 0.5) * scale));
    }

    return m;
  }

  private dot(a: number[], b: number[]): number {
    let s = 0;

    for (let k = 0; k < a.length; k++) {
      s += a[k] * b[k];
    }

    return s;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
