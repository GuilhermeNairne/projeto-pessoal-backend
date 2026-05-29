import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { ApiKeyGuard } from './guards/apiKey.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TarefasModule } from './modules/tarefas/tarefas.module';
import { UserInfoModule } from './modules/userInfo/userInfo.module';
import { FinancialModule } from './modules/financial/financial.module';

@Module({
  imports: [
    FinancialModule,
    PrismaModule,
    UserInfoModule,
    AuthModule,
    TarefasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
