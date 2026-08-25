import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
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
  Req,
  UseGuards,
} from '@nestjs/common';

@Controller('financial-panel')
@UseGuards(JwtAuthGuard)
export class PanelFinancialController {
  constructor(private readonly panelService: PanelService) {}

  @Post('create')
  async createPainel(@Body() body: PanelDTO, @Req() req) {
    const result = await this.panelService.createPanel(body, req.user.id);

    return result;
  }

  @Get('list')
  async listPanels(@Req() req) {
    const result = await this.panelService.listPanels(req.user.id);

    return result;
  }

  @Patch('update/:id')
  async updatePainel(
    @Param('id') id: number,
    @Body() body: Partial<PanelDTO>,
    @Req() req,
  ) {
    const result = await this.panelService.updatePanel(id, body, req.user.id);

    return result;
  }

  @Delete('delete/:id')
  async deletePainel(@Param('id') id: number, @Req() req) {
    const result = await this.panelService.deletePanel(id, req.user.id);

    return result;
  }

  @Get('fees/:id')
  async feesByMonth(@Param('id') id: number, @Req() req) {
    const result = await this.panelService.feesByMonth(id, req.user.id);

    return result;
  }

  @Get('expenses-graphics/:id')
  async expensesGraphics(
    @Param('id') id: number,
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req,
  ) {
    return this.panelService.expensesGraphics(id, month, year, req.user.id);
  }
}
