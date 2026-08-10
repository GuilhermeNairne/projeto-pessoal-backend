import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class AssignRoleDto {
  @IsNumber()
  @IsNotEmpty()
  roleId!: number;
}
