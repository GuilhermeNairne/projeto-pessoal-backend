import { PainelsDTO } from './dtos/painels.dto';
import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async createPainel(body: PainelsDTO) {
    try {
      const result = await this.prisma.painels.create({ data: body });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao criar painel',
        error.status ?? 500,
      );
    }
  }

  async listPanels() {
    try {
      const result = await this.prisma.painels.findMany();
      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao listar paineis',
        error.status ?? 500,
      );
    }
  }

  async updatePainel(id: number, body: Partial<PainelsDTO>) {
    try {
      const result = await this.prisma.painels.update({
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

  async deletePainel(id: number) {
    try {
      const result = await this.prisma.painels.delete({
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
