import { Module } from '@nestjs/common';
import { PanelService } from './panel/panel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PanelFinancialController } from './panel/panel.controller';

@Module({
  controllers: [PanelFinancialController],
  providers: [PanelService],
  imports: [PrismaModule],
})
export class FinancialModule {}
