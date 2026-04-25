import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinancialModule } from './modules/financial/financial.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UserInfoModule } from './modules/userInfo/userInfo.module';
import { AuthModule } from './modules/auth/auth.module';
import { TarefasModule } from './modules/tarefas/tarefas.module';

@Module({
  imports: [
    FinancialModule,
    PrismaModule,
    UserInfoModule,
    AuthModule,
    TarefasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
