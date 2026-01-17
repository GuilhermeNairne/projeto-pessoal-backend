import { PainelsDTO } from './dtos/painels.dto';
import { FinancialService } from './financial.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('create-painel')
  async createPainel(@Body() body: PainelsDTO) {
    const result = await this.financialService.createPainel(body);

    return result;
  }

  @Get('list-panels')
  async listPanels() {
    const result = await this.financialService.listPanels();

    return result;
  }

  @Patch('update-painel/:id')
  async updatePainel(
    @Param('id') id: number,
    @Body() body: Partial<PainelsDTO>,
  ) {
    const result = await this.financialService.updatePainel(id, body);

    return result;
  }

  @Delete('delete-painel/:id')
  async deletePainel(@Param('id') id: number) {
    const result = await this.financialService.deletePainel(id);

    return result;
  }

  @Post('register-movement')
  async registerMovement() {}

  @Get('list-movements')
  async listMovements() {}

  @Delete('delete-movement')
  async deleteMovement() {}

  @Post('create-category')
  async creteCategory() {}

  @Get('list-categories')
  async listCategories() {}

  @Delete('delete-category')
  async deleteCategory() {}

  @Patch('update-category')
  async updateCategory() {}
}
