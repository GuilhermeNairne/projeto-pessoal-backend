import { HttpException, Injectable } from '@nestjs/common';
import { CategoriasTarefaDTO, TarefasDTO } from './tarefas.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TarefasService {
  constructor(private prisma: PrismaService) {}

  async createTarefa(body: TarefasDTO) {
    try {
      const result = await this.prisma.tarefas.create({ data: body });

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao criar tarefa',
        error.status ?? 500,
      );
    }
  }

  async createCategoria(body: CategoriasTarefaDTO) {
    try {
      const result = await this.prisma.categorias_tarefa.create({ data: body });

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao criar categoria da tarefa',
        error.status ?? 500,
      );
    }
  }

  async listTarefas() {
    try {
      const result = await this.prisma.tarefas.findMany();

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao listar tarefa',
        error.status ?? 500,
      );
    }
  }

  async listCategorias() {
    try {
      const result = await this.prisma.categorias_tarefa.findMany();

      return result;
    } catch (error: any) {
      throw new HttpException(
        error.response ?? 'Erro ao listar categorias',
        error.status ?? 500,
      );
    }
  }

  async deleteCategoria(id: number) {
    try {
      const result = await this.prisma.categorias_tarefa.delete({
        where: { id },
      });

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao deletar categoria',
        error.status ?? 500,
      );
    }
  }

  async deleteTarefa(id: number) {
    try {
      const result = await this.prisma.tarefas.delete({
        where: { id },
      });

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao deletar tarefa',
        error.status ?? 500,
      );
    }
  }

  async patchTarefa(id: number, body: Partial<TarefasDTO>) {
    try {
      const result = await this.prisma.tarefas.update({
        where: { id },
        data: body,
      });

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao atualizar tarefa',
        error.status ?? 500,
      );
    }
  }

  async patchCategoria(id: number, body: Partial<CategoriasTarefaDTO>) {
    try {
      const result = await this.prisma.categorias_tarefa.update({
        where: { id },
        data: body,
      });

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao atualizar categoria',
        error.status ?? 500,
      );
    }
  }
}
