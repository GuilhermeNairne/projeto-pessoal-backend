import { Module } from '@nestjs/common';
import { PanelService } from './panel/panel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoryService } from './category/category.service';
import { PanelFinancialController } from './panel/panel.controller';
import { CategoryController } from './category/category.controller';
import { MovementController } from './movement/movement.controller';
import { MovementService } from './movement/movement.service';

@Module({
  controllers: [
    PanelFinancialController,
    CategoryController,
    MovementController,
  ],
  providers: [PanelService, CategoryService, MovementService],
  imports: [PrismaModule],
})
export class FinancialModule {}
