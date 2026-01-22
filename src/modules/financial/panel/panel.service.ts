import { PanelDTO } from './panel.dto';
import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class PanelService {
  constructor(private prisma: PrismaService) {}

  async createPanel(body: PanelDTO) {
    try {
      const result = await this.prisma.panels.create({ data: body });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao criar painel',
        error.status ?? 500,
      );
    }
  }

  async listPanels(user_id: string) {
    try {
      const result = await this.prisma.panels.findMany({
        where: {
          user_id,
        },
        include: {
          categories: true,
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao listar paineis',
        error.status ?? 500,
      );
    }
  }

  async updatePanel(id: number, body: Partial<PanelDTO>) {
    try {
      const result = await this.prisma.panels.update({
        where: { id: Number(id) },
        data: body,
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao alterar painel',
        error.status ?? 500,
      );
    }
  }

  async deletePanel(id: number) {
    try {
      const result = await this.prisma.panels.delete({
        where: { id: Number(id) },
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao deletar painel',
        error.status ?? 500,
      );
    }
  }
}
