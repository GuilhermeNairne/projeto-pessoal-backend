import { PainelsDTO } from './dtos/painels.dto';
import { FinancialService } from './financial.service';
import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';

@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('create-painel')
  async createPainel(@Body() body: PainelsDTO) {
    const result = await this.financialService.createPainel(body);

    return result;
  }

  @Get('list-painels')
  async listPainels() {}

  @Patch('update-painel')
  async updatePainel() {}

  @Delete('delete-painel')
  async deletePainel() {}

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
