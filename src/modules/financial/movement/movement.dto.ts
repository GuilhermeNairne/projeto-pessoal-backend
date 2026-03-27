import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class MovementDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  movement_type: string;

  @IsNumber()
  @IsNotEmpty()
  painel_id: number;

  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @Type(() => Date)
  @IsDate()
  date: Date;
}

export class MovementsFilterDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  movement_type?: string;

  @IsString()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  order_date?: 'ASC' | 'DESC';

  @IsString()
  @IsOptional()
  page?: string;
}
