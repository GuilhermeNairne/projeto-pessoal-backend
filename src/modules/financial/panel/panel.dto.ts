import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class PanelDTO {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  initial_value: number;
}
