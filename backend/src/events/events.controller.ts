import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFiles, ParseIntPipe,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, EventFilterDto } from './dto/event.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/guards/auth.guards';
import { AuthGuard } from '@nestjs/passport';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Public endpoints (guest + authenticated)
  @Get()
  findAll(@Query() filter: EventFilterDto) {
    return this.eventsService.findAll(filter);
  }

  @Get('categories')
  getCategories() {
    return this.eventsService.getCategories();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.id;
    return this.eventsService.findOne(id, userId);
  }

  // Organizer endpoints
  @Get('organizer/my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  getMyEvents(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findByOrganizer(user.id, page, limit);
  }

  @Get(':id/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  getEventBookings(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.getEventBookings(id, user.role === 'ADMIN' ? null : user.id, page, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  create(@Body() dto: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsService.create(dto, user.id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.eventsService.publish(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.update(id, dto, user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.eventsService.cancel(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.eventsService.delete(id, user.id);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `event-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) cb(new Error('Only images allowed'), false);
        else cb(null, true);
      },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    const saved = [];
    for (const f of files) {
      const photo = await this.eventsService.addPhoto(id, user.id, f.filename);
      saved.push(photo);
    }
    return saved;
  }

  // Admin only
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllAdmin() {
    return this.eventsService.findAllForAdmin();
  }
}
