import { TarefasService } from './tarefas.service';
import { CategoriasTarefaDTO, TarefasDTO } from './tarefas.dto';
import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Delete,
  Controller,
} from '@nestjs/common';

@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Post()
  async createTarefa(@Body() body: TarefasDTO) {
    return await this.tarefasService.createTarefa(body);
  }

  @Post('create-categoria')
  async createCategoria(@Body() body: CategoriasTarefaDTO) {
    return await this.tarefasService.createCategoria(body);
  }

  @Get()
  async listTarefas() {
    return await this.tarefasService.listTarefas();
  }

  @Get('list-categorias')
  async listCategorias() {
    return await this.tarefasService.listCategorias();
  }

  @Delete('/:id')
  async deleteTarefa(@Param('id') id: number) {
    return await this.tarefasService.deleteTarefa(id);
  }

  @Delete('/delete-categoria/:id')
  async deleteCategoria(@Param('id') id: number) {
    return await this.tarefasService.deleteCategoria(id);
  }

  @Patch('/:id')
  async patchTarefa(@Param('id') id: number, body: Partial<TarefasDTO>) {
    return await this.tarefasService.patchTarefa(id, body);
  }

  @Patch('/patch-categoria/:id')
  async patchCategoria(
    @Param('id') id: number,
    body: Partial<CategoriasTarefaDTO>,
  ) {
    return await this.tarefasService.patchCategoria(id, body);
  }
}
