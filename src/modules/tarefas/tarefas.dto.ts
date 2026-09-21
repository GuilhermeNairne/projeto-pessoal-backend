import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class TarefasDTO {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsOptional()
  status = 'Pendente';

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  categoriaId!: number;

  @IsNumber()
  @IsOptional()
  tempo = 0;

  @Type(() => Date)
  @IsDate()
  data!: Date;
}

export class CategoriasTarefaDTO {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  cor!: string;

  @IsString()
  @IsNotEmpty()
  user_id!: string;
}
