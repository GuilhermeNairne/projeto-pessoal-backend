import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
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

export class UpdateContactDTO {
  // null/ausente limpa o campo e volta a usar o e-mail de login
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  notificationEmail?: string | null;
}
