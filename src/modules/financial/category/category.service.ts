import { CategoryDTO } from './category.dto';
import {
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  private async assertPanelOwnership(panel_id: number, user_id: string) {
    const panel = await this.prismaService.panels.findUnique({
      where: { id: Number(panel_id) },
      select: { user_id: true },
    });

    if (!panel || panel.user_id !== user_id) {
      throw new ForbiddenException('Acesso negado a este painel');
    }
  }

  private async assertCategoryOwnership(id: number, user_id: string) {
    const category = await this.prismaService.categories.findUnique({
      where: { id: Number(id) },
      select: { painel_id: true },
    });

    if (!category) {
      throw new ForbiddenException('Categoria não encontrada');
    }

    await this.assertPanelOwnership(category.painel_id, user_id);
  }

  async createCategory(body: CategoryDTO, user_id: string) {
    try {
      await this.assertPanelOwnership(body.panel_id, user_id);

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
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.response ?? 'Erro ao criar categoria',
        error.status ?? 500,
      );
    }
  }

  async listCategories(painel_id: number[], user_id: string) {
    try {
      await Promise.all(
        painel_id.map((id) => this.assertPanelOwnership(id, user_id)),
      );

      const result = await this.prismaService.categories.findMany({
        where: {
          painel_id: {
            in: painel_id,
          },
        },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao buscar categorias',
        error.status ?? 500,
      );
    }
  }

  async editCategory(id: number, body: Partial<CategoryDTO>, user_id: string) {
    try {
      await this.assertCategoryOwnership(id, user_id);

      if (body.panel_id) {
        await this.assertPanelOwnership(body.panel_id, user_id);
      }

      const result = await this.prismaService.categories.update({
        where: { id: Number(id) },
        data: body,
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao atualizar categoria',
        error.status ?? 500,
      );
    }
  }

  async deleteCategory(id: number, user_id: string) {
    try {
      await this.assertCategoryOwnership(id, user_id);

      const result = await this.prismaService.categories.delete({
        where: { id: Number(id) },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new HttpException(
        error ?? 'Erro ao deletar categoria',
        error.status ?? 500,
      );
    }
  }
}
