import { Module } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [FinancialController],
  providers: [FinancialService],
  imports: [PrismaModule],
})
export class FinancialModule {}
