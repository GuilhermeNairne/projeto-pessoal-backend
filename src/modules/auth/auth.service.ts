import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';
import { UserRepository } from './user.repository';
import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async login(values: { email: string; password: string }) {
    try {
      const { email, password } = values;
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '1h' },
      );

      const refreshToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
      );

      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

      await this.userRepository.updateRefreshToken(user.id, refreshTokenHash);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      console.log(error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao realizar login');
    }
  }

  async logout(userId: string) {
    await this.userRepository.updateRefreshToken(userId, null);
  }

  async refresh(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException();
      }

      let payload: any;

      payload = this.jwtService.verify(refreshToken);

      const user = await this.userRepository.findUser(payload);

      const tokenMatch = await bcrypt.compare(refreshToken, user?.refreshToken);
      if (!tokenMatch) throw new UnauthorizedException();

      const accessToken = this.jwtService.sign(
        {},
        {
          subject: user?.id,
          expiresIn: '1h',
        },
      );

      return {
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
        },
        accessToken,
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao fazer refresh token',
        error.status,
      );
    }
  }

  async register(values: RegisterDto) {
    try {
      const userExists = await this.userRepository.findByEmail(values.email);

      if (userExists) {
        throw new ConflictException('Email já cadastrado');
      }

      const passwordHash = await bcrypt.hash(values.password, 10);

      const user = await this.userRepository.registerUser({
        name: values.name,
        email: values.email,
        password: passwordHash,
        profile_picture: values.profile_picture,
      });

      const accessToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '1h' },
      );
      const refreshToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
      );

      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

      await this.userRepository.updateRefreshToken(user.id, refreshTokenHash);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error ?? 'Erro ao fazer cadastro', error.status);
    }
  }

  async list() {
    try {
      const response = await this.userRepository.listUsers();

      return response;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error ?? 'Erro ao listar usuários', error.status);
    }
  }

  async delete(id: string) {
    try {
      const response = await this.userRepository.DeleteUser(id);

      return response;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error ?? 'Erro ao deletar usuário', error.status);
    }
  }

  async update(id: string, update: Partial<RegisterDto>) {
    try {
      const response = await this.userRepository.updateUser(id, update);

      return response;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao atualizar usuário',
        error.status,
      );
    }
  }
}
