import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MovementDTO } from './movement.dto';

@Injectable()
export class MovementService {
  constructor(private prisma: PrismaService) {}

  async createMovement(body: MovementDTO) {
    try {
      const result = await this.prisma.movements.create({ data: body });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao criar movimento',
        error.status ?? 500,
      );
    }
  }

  async listMovements(panel_id: number) {
    try {
      const result = await this.prisma.movements.findMany({
        where: {
          painel_id: Number(panel_id),
        },
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao listar movimentações',
        error.status ?? 500,
      );
    }
  }

  async deleteMovement(id: number) {
    try {
      const result = await this.prisma.movements.delete({
        where: {
          id,
        },
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao deletar movimento',
        error.status ?? 500,
      );
    }
  }

  async updateMovement(id: number, body: Partial<MovementDTO>) {
    try {
      const result = await this.prisma.movements.update({
        where: {
          id,
        },
        data: body,
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao atualizar movimento',
        error.status ?? 500,
      );
    }
  }
}
