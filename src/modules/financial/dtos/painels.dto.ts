import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class PainelsDTO {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;
}
