import { HttpException, Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RecoveryPasswordUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(email: string) {
    try {
      const isValid = await this.userRepository.findByEmail(email);

      if (!isValid) throw new Error('E-mail inválido!');

      const code = randomInt(100000, 1000000).toString();

      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 15 * 60_000);

      await this.userRepository.setPasswordCodeRecovery(
        email,
        codeHash,
        expiresAt,
      );

      await this.authService.sendEmailPasswordRecovery(Number(code), email);
    } catch (error: any) {
      throw new HttpException('Erro ao validar e-mail', error.status ?? 500);
    }
  }
}
