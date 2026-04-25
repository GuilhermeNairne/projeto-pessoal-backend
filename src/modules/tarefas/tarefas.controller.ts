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
  Query,
} from '@nestjs/common';
import type { ListTarefasType } from './tarefas.type';

@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Post()
  async createTarefa(@Body() body: TarefasDTO) {
    return await this.tarefasService.createTarefa(body);
  }

  @Get()
  async listTarefas(@Query() query: ListTarefasType) {
    return await this.tarefasService.listTarefas(query);
  }

  @Get('/semana')
  async listTarefaSemana(
    @Query('primeiroDia') primeiroDia: string,
    @Query('ultimoDia') ultimoDia: string,
  ) {
    return await this.tarefasService.listTarefaSemana(primeiroDia, ultimoDia);
  }

  @Delete('/:id')
  async deleteTarefa(@Param('id') id: number) {
    return await this.tarefasService.deleteTarefa(id);
  }

  @Get('list-cards')
  async listCardsTarefas(@Query() query: ListTarefasType) {
    return await this.tarefasService.listCardsTarefas(query);
  }

  @Patch('/:id')
  async patchTarefa(
    @Param('id') id: number,
    @Body() body: Partial<TarefasDTO>,
  ) {
    return await this.tarefasService.patchTarefa(id, body);
  }

  @Post('create-categoria')
  async createCategoria(@Body() body: CategoriasTarefaDTO) {
    return await this.tarefasService.createCategoria(body);
  }

  @Get('list-categorias/:user_id')
  async listCategorias(@Param('user_id') user_id: string) {
    return await this.tarefasService.listCategorias(user_id);
  }

  @Delete('/delete-categoria/:id')
  async deleteCategoria(@Param('id') id: number) {
    return await this.tarefasService.deleteCategoria(id);
  }

  @Patch('/patch-categoria/:id')
  async patchCategoria(
    @Param('id') id: number,
    @Body() body: Partial<CategoriasTarefaDTO>,
  ) {
    return await this.tarefasService.patchCategoria(id, body);
  }
}
