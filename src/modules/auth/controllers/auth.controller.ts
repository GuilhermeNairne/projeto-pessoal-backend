import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RecoveryPasswordUseCase } from '../useCases/recoveryPassword.useCase';
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

export interface RegisterTpye {
  name: string;
  email: string;
  password: string;
  profile_picture?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly recoveryPasswordUseCase: RecoveryPasswordUseCase,
  ) {}

  private readonly accessTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    partitioned: true,
    maxAge: 60 * 60 * 1000,
  };

  private readonly refreshTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    partitioned: true,
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(body);

    res.cookie('accessToken', accessToken, this.accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, this.refreshTokenCookieOptions);

    return { user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const userId = req.user.id;
    await this.authService.logout(userId);

    res.clearCookie('accessToken', this.accessTokenCookieOptions);
    res.clearCookie('refreshToken', this.refreshTokenCookieOptions);
  }

  @Post('register')
  async register(@Body() values: RegisterDto) {
    return await this.authService.register(values);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req) {
    return { user: req.user };
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
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const refreshToken = req.cookies['refreshToken'];
    const { user, accessToken } = await this.authService.refresh(refreshToken);

    res.cookie('accessToken', accessToken, this.accessTokenCookieOptions);

    return { user };
  }

  @Post('send-email-password-recovery')
  async sendEmailPasswordRecovery(@Body('email') email: string) {
    await this.recoveryPasswordUseCase.execute(email);
  }
}
