import { PanelService } from './panel.service';
import { PanelDTO } from './panel.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

  @Patch('update-panel/:id')
  async updatePainel(@Param('id') id: number, @Body() body: Partial<PanelDTO>) {
    const result = await this.panelService.updatePanel(id, body);

    return result;
  }

  @Delete('delete/:id')
  async deletePainel(@Param('id') id: number) {
    const result = await this.panelService.deletePanel(id);

    return result;
  }

  @Post('register-movement')
  async registerMovement() {}

  @Get('list-movements')
  async listMovements() {}

  @Delete('delete-movement')
  async deleteMovement() {}
}
