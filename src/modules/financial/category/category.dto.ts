import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CategoryDTO {
  @IsString()
  @IsNotEmpty()
  panel_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsArray()
  movements: [];
}
