import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BookingsService, CreateBookingDto } from './bookings.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/guards/auth.guards';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ATTENDEE', 'ORGANIZER', 'ADMIN')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(dto, user.id);
  }

  @Get('my')
  getMyBookings(@CurrentUser() user: any) {
    return this.bookingsService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user.id);
  }
}
