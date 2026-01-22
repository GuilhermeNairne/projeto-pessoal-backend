import { CategoryDTO } from './category.dto';
import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async createCategory(body: CategoryDTO) {
    try {
      const result = await this.prismaService.categories.create({
        data: {
          name: body.name,
          color: body.color,
          panel: {
            connect: { id: body.panel_id },
          },
        },
      });

      return result;
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Erro ao criar categoria',
        error.status ?? 500,
      );
    }
  }

  async listCategories(painel_id: number[]) {
    try {
      const result = await this.prismaService.categories.findMany({
        where: {
          painel_id: {
            in: painel_id,
          },
        },
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao buscar categorias',
        error.status ?? 500,
      );
    }
  }

  async editCategory(id: number, body: Partial<CategoryDTO>) {
    try {
      const result = await this.prismaService.categories.update({
        where: { id: Number(id) },
        data: body,
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao atualizar categoria',
        error.status ?? 500,
      );
    }
  }

  async deleteCategory(id: number) {
    try {
      const result = await this.prismaService.categories.delete({
        where: { id: Number(id) },
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao deletar categoria',
        error.status ?? 500,
      );
    }
  }
}
