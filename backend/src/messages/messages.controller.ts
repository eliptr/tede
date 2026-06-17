import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { MessagesService, SendMessageDto } from './messages.service';
import { JwtAuthGuard, CurrentUser } from '../auth/guards/auth.guards';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.messagesService.send(dto, user.id);
  }

  @Get('inbox')
  inbox(@CurrentUser() user: any) {
    return this.messagesService.getInbox(user.id);
  }

  @Get('sent')
  sent(@CurrentUser() user: any) {
    return this.messagesService.getSent(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.messagesService.markRead(id, user.id);
  }

  @Delete('inbox/:id')
  deleteInbox(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.messagesService.deleteFromInbox(id, user.id);
  }

  @Delete('sent/:id')
  deleteSent(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.messagesService.deleteFromSent(id, user.id);
  }
}
