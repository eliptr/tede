import {
  IsNotEmpty, IsString, IsArray, IsNumber, IsDateString, IsOptional,
  ValidateNested, Min, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TicketTypeDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateEventDto {
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsNotEmpty()
  event_type: string;

  @IsNotEmpty()
  venue: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  country: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsDateString()
  start_datetime: string;

  @IsDateString()
  end_datetime: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketTypeDto)
  ticket_types: TicketTypeDto[];
}

export class UpdateEventDto {
  title?: string;
  categories?: string[];
  event_type?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  start_datetime?: string;
  end_datetime?: string;
  capacity?: number;
  description?: string;
  ticket_types?: TicketTypeDto[];
}

export class EventFilterDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_max?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
