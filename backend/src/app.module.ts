import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { MessagesModule } from './messages/messages.module';
import { ExportModule } from './export/export.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entity';
import { TicketType } from './entities/ticket-type.entity';
import { Booking } from './entities/booking.entity';
import { Message } from './entities/message.entity';
import { EventPhoto } from './entities/event-photo.entity';
import { UserEventView } from './entities/user-event-view.entity';
import { RecommendationInteraction } from './entities/recommendation-interaction.entity';
import { UserFriend } from './entities/user-friend.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: +config.get('DB_PORT', 3306),
        username: config.get('DB_USER', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'ted2026'),
        entities: [
          User, Event, EventCategory, TicketType, Booking, Message, EventPhoto,
          UserEventView, RecommendationInteraction, UserFriend,
        ],
        synchronize: true, // Set to false in production, use migrations
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    BookingsModule,
    MessagesModule,
    ExportModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
