import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Event } from '../entities/event.entity';
import { Booking } from '../entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Booking])],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
