import { HttpException, Injectable } from '@nestjs/common';
import { PainelsDTO } from './dtos/painels.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async createPainel(body: PainelsDTO) {}

  async listPainels() {
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
}
