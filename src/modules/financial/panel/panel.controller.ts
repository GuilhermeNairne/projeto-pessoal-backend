import { PanelDTO } from './panel.dto';
import { PanelService } from './panel.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

@Controller('financial-panel')
export class PanelFinancialController {
  constructor(private readonly panelService: PanelService) {}

  @Post('create')
  async createPainel(@Body() body: PanelDTO) {
    const result = await this.panelService.createPanel(body);

    return result;
  }

  @Get('list/:user_id')
  async listPanels(@Param('user_id') user_id: string) {
    const result = await this.panelService.listPanels(user_id);

    return result;
  }

  @Patch('update/:id')
  async updatePainel(@Param('id') id: number, @Body() body: Partial<PanelDTO>) {
    const result = await this.panelService.updatePanel(id, body);

    return result;
  }

  @Delete('delete/:id')
  async deletePainel(@Param('id') id: number) {
    const result = await this.panelService.deletePanel(id);

    return result;
  }

  @Get('list-juros/:id')
  async listJuros(@Param('id') id: number) {
    const result = await this.panelService.listJuros(id);

    return result;
  }

  @Get('expenses-graphics/:id')
  async expensesGraphics(
    @Param('id') id: number,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.panelService.expensesGraphics(id, month, year);
  }
}
