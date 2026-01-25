import { MovementDTO } from './movement.dto';
import { MovementService } from './movement.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

@Controller('financial-movement')
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @Post('create')
  async createMovement(@Body() body: MovementDTO) {
    const result = await this.movementService.createMovement(body);

    return result;
  }

  @Get('list/:panel_id')
  async listMovements(@Param('panel_id') panel_id: number) {
    const result = await this.movementService.listMovements(panel_id);

    return result;
  }

  @Delete('delete/:id')
  async deleteMovement(@Param('id') id: number) {
    const result = await this.movementService.deleteMovement(id);

    return result;
  }

  @Patch('update/:id')
  async updateMovement(
    @Param('id') id: number,
    @Body() body: Partial<MovementDTO>,
  ) {
    const result = await this.movementService.updateMovement(id, body);

    return result;
  }
}
