import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum NotificationMethod {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  BOTH = 'BOTH',
}

export class NotificationDTO {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Date)
  @IsDate()
  date!: Date;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean = true;

  @IsEnum(NotificationMethod)
  @IsNotEmpty()
  method!: NotificationMethod;
}
