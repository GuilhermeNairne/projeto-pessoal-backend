import { RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

export interface RegisterTpye {
  name: string;
  email: string;
  password: string;
  profile_picture?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() values: { email: string; password: string }) {
    return await this.authService.login(values);
  }

  @Post('register')
  async register(@Body() values: RegisterDto) {
    return await this.authService.register(values);
  }

  @Get('list')
  async list() {
    return await this.authService.list();
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return this.authService.delete(id);
  }

  @Patch('/:id')
  async update(@Param('id') id: string, @Body() update: Partial<RegisterDto>) {
    return await this.authService.update(id, update);
  }
}
