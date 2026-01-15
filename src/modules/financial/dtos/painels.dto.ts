import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class PainelsDTO {
  @IsString()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  initial_value: number;
}
