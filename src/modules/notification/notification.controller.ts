import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Delete,
  Controller,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationDTO } from './notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() body: NotificationDTO) {
    return await this.notificationService.create(body);
  }

  @Post('send')
  async sendDueNotifications() {
    return await this.notificationService.sendDueNotifications();
  }

  @Post('send-test/:email')
  async sendTestEmail(@Param('email') email: string) {
    return await this.notificationService.sendTestEmail(email);
  }

  @Get('debug')
  async debugNotifications() {
    return await this.notificationService.debugNotifications();
  }

  @Get(':userId')
  async findAll(@Param('userId') userId: string) {
    return await this.notificationService.findAll(userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() body: Partial<NotificationDTO>,
  ) {
    return await this.notificationService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.notificationService.delete(id);
  }
}
