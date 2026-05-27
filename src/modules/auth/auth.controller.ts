import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

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
  async login(@Body() @Body() body: LoginDto, @Res({ passthrough: true }) res) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(body);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const userId = req.user.id;
    await this.authService.logout(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
  }

  @Post('register')
  async register(@Body() values: RegisterDto) {
    return await this.authService.register(values);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async list() {
    return await this.authService.list();
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.authService.delete(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() update: Partial<RegisterDto>) {
    return await this.authService.update(id, update);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const refreshToken = req.cookies['refreshToken'];
    const { user, accessToken } = await this.authService.refresh(refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    return { user };
  }
}
