import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

  @IsDate()
  date: Date;
}
