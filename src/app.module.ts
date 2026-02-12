import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinancialModule } from './modules/financial/financial.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UserInfoModule } from './modules/userInfo/userInfo.module';

@Module({
  imports: [FinancialModule, PrismaModule, UserInfoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
