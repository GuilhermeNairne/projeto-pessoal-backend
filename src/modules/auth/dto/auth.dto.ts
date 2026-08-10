import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  profile_picture?: string;
}
