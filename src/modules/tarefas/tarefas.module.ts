import { Module } from '@nestjs/common';
import { TarefasController } from './tarefas.controller';
import { TarefasService } from './tarefas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [TarefasController],
  providers: [TarefasService],
  imports: [PrismaModule, NotificationModule],
})
export class TarefasModule {}
