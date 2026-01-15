import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinancialModule } from './modules/financial/financial.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [FinancialModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
