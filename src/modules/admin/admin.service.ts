import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/admin.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  profilePicture: true,
  roles: { select: { id: true, name: true } },
  createdAt: true,
};

const PRISMA_UNIQUE_CONSTRAINT = 'P2002';
const PRISMA_RECORD_NOT_FOUND = 'P2025';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    try {
      return await this.prisma.user.findMany({
        select: userSelect,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      throw new HttpException(
        error ?? 'Erro ao listar usuários',
        error.status ?? 500,
      );
    }
  }

  async listRoles() {
    try {
      return await this.prisma.roles.findMany({ orderBy: { name: 'asc' } });
    } catch (error: any) {
      throw new HttpException(
        error ?? 'Erro ao listar roles',
        error.status ?? 500,
      );
    }
  }

  async createRole(body: CreateRoleDto) {
    try {
      return await this.prisma.roles.create({ data: { name: body.name } });
    } catch (error: any) {
      if (error?.code === PRISMA_UNIQUE_CONSTRAINT) {
        throw new ConflictException('Já existe uma role com esse nome');
      }
      throw new HttpException(
        error ?? 'Erro ao criar role',
        error.status ?? 500,
      );
    }
  }

  async updateRole(id: number, body: Partial<CreateRoleDto>) {
    try {
      return await this.prisma.roles.update({
        where: { id },
        data: body,
      });
    } catch (error: any) {
      if (error?.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundException('Role não encontrada');
      }
      if (error?.code === PRISMA_UNIQUE_CONSTRAINT) {
        throw new ConflictException('Já existe uma role com esse nome');
      }
      throw new HttpException(
        error ?? 'Erro ao atualizar role',
        error.status ?? 500,
      );
    }
  }

  async deleteRole(id: number) {
    try {
      return await this.prisma.roles.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundException('Role não encontrada');
      }
      throw new HttpException(
        error ?? 'Erro ao deletar role',
        error.status ?? 500,
      );
    }
  }

  async addRole(userId: string, roleId: number) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { roles: { connect: { id: roleId } } },
        select: userSelect,
      });
    } catch (error: any) {
      if (error?.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundException('Usuário ou role não encontrados');
      }
      throw new HttpException(
        error ?? 'Erro ao adicionar role',
        error.status ?? 500,
      );
    }
  }

  async removeRole(userId: string, roleId: number) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { roles: { disconnect: { id: roleId } } },
        select: userSelect,
      });
    } catch (error: any) {
      if (error?.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundException('Usuário ou role não encontrados');
      }
      throw new HttpException(
        error ?? 'Erro ao remover role',
        error.status ?? 500,
      );
    }
  }
}
