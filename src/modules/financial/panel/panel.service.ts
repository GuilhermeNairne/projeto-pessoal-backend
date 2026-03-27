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
      const panels = await this.prisma.panels.findMany({
        where: { user_id },
        include: {
          categories: {
            include: {
              movements: {
                where: {
                  movement_type: 'OUT',
                },
                select: {
                  value: true,
                },
              },
            },
          },
          movements: {
            include: {
              categories: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
      });

      const jurosByMonth: any = await this.prisma.$queryRaw`
  SELECT 
    m.painel_id,
    DATE_TRUNC('month', m.created_at) AS month,
    SUM(m.value) AS total
  FROM movements m
  JOIN categories c ON c.id = m.category_id
  JOIN panels p ON p.id = m.painel_id
  WHERE c.name ILIKE '%juros%'
    AND p.user_id = ${user_id}
  GROUP BY m.painel_id, month
  ORDER BY m.painel_id, month;
`;

      const result = panels.map((panel) => ({
        ...panel,
        categories: panel.categories.map((category) => {
          const totalSpent = category.movements.reduce(
            (acc, mov) => acc + Number(mov.value),
            0,
          );

          return {
            ...category,
            totalSpent,
            movements: undefined,
          };
        }),
        juros: jurosByMonth.filter((item) => item.painel_id === panel.id),
      }));

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

  async listJuros(id: number) {
    try {
      const category = await this.prisma.categories.findFirst({
        where: {
          painel_id: id,
          name: {
            contains: 'juros',
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
        },
      });

      const result = await this.prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('month', created_at) AS month,
    SUM(value) AS total
  FROM movements
  WHERE category_id = ${category?.id}
  GROUP BY month
  ORDER BY month;
`;

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Erro ao listar juros dessa painel',
        error.status,
      );
    }
  }
}
