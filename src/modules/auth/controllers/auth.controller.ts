import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/auth.dto';
import { UpdateNameDto } from '../dto/update-name.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RecoveryPasswordUseCase } from '../useCases/recoveryPassword.useCase';
import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnsupportedMediaTypeException,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

@Catch(PayloadTooLargeException)
class ProfilePictureTooLargeFilter implements ExceptionFilter {
  catch(exception: PayloadTooLargeException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    res.status(413).json({
      statusCode: 413,
      error: 'Payload Too Large',
      message: `A imagem deve ter no máximo ${MAX_PROFILE_PICTURE_SIZE / (1024 * 1024)}MB`,
    });
  }
}

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

  private readonly resetPasswordTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    partitioned: true,
    path: '/auth/reset-password',
    maxAge: 10 * 60 * 1000,
  };

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
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
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  async register(@Body() values: RegisterDto) {
    return await this.authService.register(values);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req) {
    return { user: req.user };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req, @Body() body: UpdateNameDto) {
    const updated = await this.authService.updateName(req.user.id, body.name);

    return { user: { ...req.user, ...updated } };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async changePassword(@Req() req, @Body() body: ChangePasswordDto) {
    return await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('me/picture')
  @UseGuards(JwtAuthGuard)
  @UseFilters(ProfilePictureTooLargeFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROFILE_PICTURE_SIZE },
    }),
  )
  async uploadProfilePicture(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new UnsupportedMediaTypeException('Nenhum arquivo enviado');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new UnsupportedMediaTypeException(
        'O arquivo enviado deve ser uma imagem',
      );
    }

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return await this.authService.uploadProfilePicture(req.user.id, dataUri);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(
    @Req() req,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) res,
  ) {
    const result = await this.authService.deleteAccount(
      req.user.id,
      body.currentPassword,
    );

    res.clearCookie('accessToken', this.accessTokenCookieOptions);
    res.clearCookie('refreshToken', this.refreshTokenCookieOptions);

    return result;
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
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async sendEmailPasswordRecovery(@Body('email') email: string) {
    await this.recoveryPasswordUseCase.execute(email);
  }

  @Post('validate-code')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async validateCode(
    @Body('email') email: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res,
  ) {
    const { resetPasswordToken, ...result } =
      await this.authService.validateCode(email, code);

    res.cookie(
      'resetPasswordToken',
      resetPasswordToken,
      this.resetPasswordTokenCookieOptions,
    );

    return result;
  }

  @Post('reset-password')
  async resetPassword(
    @Req() req,
    @Body('newPassword') newPassword: string,
    @Res({ passthrough: true }) res,
  ) {
    const resetPasswordToken = req.cookies['resetPasswordToken'];
    const result = await this.authService.resetPassword(
      resetPasswordToken,
      newPassword,
    );

    res.clearCookie('resetPasswordToken', this.resetPasswordTokenCookieOptions);

    return result;
  }
}
