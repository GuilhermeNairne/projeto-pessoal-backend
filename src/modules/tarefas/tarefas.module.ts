import { Module } from '@nestjs/common';
import { TarefasController } from './tarefas.controller';
import { TarefasService } from './tarefas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [TarefasController],
  providers: [TarefasService],
  imports: [PrismaModule],
})
export class TarefasModule {}
