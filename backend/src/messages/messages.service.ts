import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

export class SendMessageDto {
  @IsInt()
  @Min(1)
  receiver_id: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  booking_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  event_id?: number;
}

@Injectable()
export class MessagesService {
  constructor(@InjectRepository(Message) private msgRepo: Repository<Message>) {}

  async send(dto: SendMessageDto, senderId: number) {
    const receiverId = Number(dto.receiver_id);
    const eventId = dto.event_id == null ? null : Number(dto.event_id);
    const bookingId = dto.booking_id == null ? null : Number(dto.booking_id);

    if (!Number.isInteger(senderId) || senderId <= 0) {
      throw new BadRequestException('Invalid sender_id');
    }

    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      throw new BadRequestException('receiver_id is required');
    }

    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Message content is required');
    }

    if (receiverId === senderId) {
      throw new BadRequestException('You cannot send a message to yourself');
    }

    const msg = this.msgRepo.create({
      sender_id: senderId,
      receiver_id: receiverId,
      content: dto.content.trim(),
      booking_id: bookingId,
      event_id: eventId,
    });

    return this.msgRepo.save(msg);
  }

  async getInbox(userId: number) {
    const msgs = await this.msgRepo.find({
      where: { receiver_id: userId, deleted_by_receiver: false },
      relations: ['sender'],
      order: { sent_at: 'DESC' },
    });

    return msgs.map((m) => ({
      ...m,
      sender: {
        id: m.sender.id,
        username: m.sender.username,
        first_name: m.sender.first_name,
        last_name: m.sender.last_name,
      },
      is_read: !!m.read_at,
    }));
  }

  async getSent(userId: number) {
    const msgs = await this.msgRepo.find({
      where: { sender_id: userId, deleted_by_sender: false },
      relations: ['receiver'],
      order: { sent_at: 'DESC' },
    });

    return msgs.map((m) => ({
      ...m,
      receiver: {
        id: m.receiver.id,
        username: m.receiver.username,
        first_name: m.receiver.first_name,
        last_name: m.receiver.last_name,
      },
    }));
  }

  async markRead(id: number, userId: number) {
    const msg = await this.msgRepo.findOne({
      where: { id, receiver_id: userId },
    });

    if (!msg) throw new NotFoundException('Message not found');

    msg.read_at = new Date();
    return this.msgRepo.save(msg);
  }

  async deleteFromInbox(id: number, userId: number) {
    const msg = await this.msgRepo.findOne({
      where: { id, receiver_id: userId },
    });

    if (!msg) throw new NotFoundException('Message not found');

    msg.deleted_by_receiver = true;
    await this.msgRepo.save(msg);

    return { message: 'Deleted from inbox' };
  }

  async deleteFromSent(id: number, userId: number) {
    const msg = await this.msgRepo.findOne({
      where: { id, sender_id: userId },
    });

    if (!msg) throw new NotFoundException('Message not found');

    msg.deleted_by_sender = true;
    await this.msgRepo.save(msg);

    return { message: 'Deleted from sent' };
  }

  async getUnreadCount(userId: number) {
    const count = await this.msgRepo.count({
      where: {
        receiver_id: userId,
        deleted_by_receiver: false,
        read_at: null,
      },
    });

    return { count };
  }

  async sendBulk(receiverIdList: number[], senderId: number, content: string, eventId: number) {
    const messages = receiverIdList
      .map((rid) => Number(rid))
      .filter((rid) => Number.isInteger(rid) && rid > 0 && rid !== senderId)
      .map((rid) =>
        this.msgRepo.create({
          sender_id: senderId,
          receiver_id: rid,
          content,
          event_id: eventId,
        }),
      );

    return this.msgRepo.save(messages);
  }
}