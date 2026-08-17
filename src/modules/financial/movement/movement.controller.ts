import { MovementService } from './movement.service';
import { MovementDTO, MovementsFilterDTO } from './movement.dto';
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
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('financial-movement')
@UseGuards(JwtAuthGuard)
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @Post('create')
  async createMovement(@Body() body: MovementDTO, @Req() req) {
    const result = await this.movementService.createMovement(
      body,
      req.user.id,
    );

    return result;
  }

  @Get('list/:panel_id')
  async listMovements(
    @Param('panel_id') panel_id: number,
    @Query() filters: MovementsFilterDTO,
    @Req() req,
  ) {
    const result = await this.movementService.listMovements(
      panel_id,
      filters,
      req.user.id,
    );

    return result;
  }

  @Get('expenses/:panel_id')
  async listExpensesByMonth(
    @Param('panel_id') panel_id: number,
    @Query('month') month: number,
    @Req() req,
  ) {
    return await this.movementService.listExpensesByMonth(
      panel_id,
      month,
      req.user.id,
    );
  }

  @Delete('delete/:id')
  async deleteMovement(@Param('id') id: number, @Req() req) {
    const result = await this.movementService.deleteMovement(
      id,
      req.user.id,
    );

    return result;
  }

  @Patch('update/:id')
  async updateMovement(
    @Param('id') id: number,
    @Body() body: Partial<MovementDTO>,
    @Req() req,
  ) {
    const result = await this.movementService.updateMovement(
      id,
      body,
      req.user.id,
    );

    return result;
  }
}
