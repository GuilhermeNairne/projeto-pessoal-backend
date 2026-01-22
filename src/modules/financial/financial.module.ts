import { Module } from '@nestjs/common';
import { PanelService } from './panel/panel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoryService } from './category/category.service';
import { PanelFinancialController } from './panel/panel.controller';
import { CategoryController } from './category/category.controller';

@Module({
  controllers: [PanelFinancialController, CategoryController],
  providers: [PanelService, CategoryService],
  imports: [PrismaModule],
})
export class FinancialModule {}
