import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { Booking } from '../entities/booking.entity';
import { UserEventView } from '../entities/user-event-view.entity';
import { Event } from '../entities/event.entity';
import { RecommendationInteraction } from '../entities/recommendation-interaction.entity';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../auth/guards/auth.guards';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get()
  getRecommendations(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationsService.getRecommendations(user.id, page || 1, limit || 6);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Booking, UserEventView, Event, RecommendationInteraction])],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
