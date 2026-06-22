import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  imports: [PrismaModule, MailModule],
})
export class NotificationModule {}
