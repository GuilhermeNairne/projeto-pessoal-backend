import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/auth.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async setPasswordCodeRecovery(
    email: string,
    passwordCodeRecovery: string | null,
  ) {
    return this.prisma.user.update({
      where: { email },
      data: { passwordCodeRecovery },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async registerUser(values: RegisterDto) {
    return this.prisma.user.create({
      data: values,
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        roles: true,
        createdAt: true,
      },
    });
  }

  async DeleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async updateUser(id: string, update: Partial<RegisterDto>) {
    return this.prisma.user.update({
      where: { id },
      data: update,
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findUser(payload: any) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }
}
