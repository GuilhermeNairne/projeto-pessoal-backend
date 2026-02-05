import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MovementDTO } from './movement.dto';

@Injectable()
export class MovementService {
  constructor(private prisma: PrismaService) {}

  async createMovement(body: MovementDTO) {
    try {
      const result = await this.prisma.movements.create({ data: body });

      const panel = await this.prisma.panels.findUnique({
        where: {
          id: Number(body.painel_id),
        },
        select: {
          initial_value: true,
        },
      });

      const current_value = Number(panel?.initial_value || 0);
      const new_value =
        body.movement_type === 'IN'
          ? current_value + Number(body.value)
          : current_value - Number(body.value);

      await this.prisma.panels.update({
        where: {
          id: Number(body.painel_id),
        },
        data: {
          initial_value: new_value,
        },
      });

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

  async deleteMovement(id: number, panel_id: number, movement_value: number) {
    try {
      const result = await this.prisma.movements.delete({
        where: {
          id: Number(id),
        },
      });

      const panel = await this.prisma.panels.findUnique({
        where: {
          id: Number(panel_id),
        },
        select: {
          initial_value: true,
        },
      });

      const new_value = Number(panel?.initial_value) + Number(movement_value);

      await this.prisma.panels.update({
        where: {
          id: panel_id,
        },
        data: {
          initial_value: new_value,
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
          id: Number(id),
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
