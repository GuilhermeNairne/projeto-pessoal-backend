import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserRepository } from './repositories/user.repository';
import { RecoveryPasswordUseCase } from './useCases/recoveryPassword.useCase';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    JwtStrategy,
    RecoveryPasswordUseCase,
  ],
})
export class AuthModule {}
