import { HttpException, Injectable } from '@nestjs/common';
import { NotificationDTO } from './notification.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(body: NotificationDTO) {
    try {
      return await this.prisma.notifications.create({ data: body });
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao criar notificação',
        error.status ?? 500,
      );
    }
  }

  async findAll(userId: string) {
    try {
      const result = await this.prisma.notifications.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      });

      if (result.length === 0)
        throw new HttpException('Nenhuma notificação encontrada', 404);

      return result;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao listar notificações',
        error.status ?? 500,
      );
    }
  }

  async update(id: number, body: Partial<NotificationDTO>) {
    try {
      if (body.date) {
        body.date = new Date(body.date);
      }

      return await this.prisma.notifications.update({
        where: { id },
        data: body,
      });
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao atualizar notificação',
        error.status ?? 500,
      );
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.notifications.delete({ where: { id } });
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao deletar notificação',
        error.status ?? 500,
      );
    }
  }

  async sendDueNotifications() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        ),
      );
      const endOfDay = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

      const notifications = await this.prisma.notifications.findMany({
        where: {
          isCurrent: true,
          date: { gte: startOfDay, lte: endOfDay },
          method: { in: ['EMAIL', 'BOTH'] },
        },
      });

      if (notifications.length === 0) {
        return { sent: 0, message: 'Nenhuma notificação para enviar hoje' };
      }

      const userIds = [...new Set(notifications.map((n) => n.userId))];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      });
      const usersMap = new Map(users.map((u) => [u.id, u]));

      let sent = 0;
      for (const notification of notifications) {
        const user = usersMap.get(notification.userId);
        if (!user) continue;

        await this.mailService.sendMail(
          user.email,
          notification.title,
          `<h2>${notification.title}</h2><p>${notification.description}</p>`,
        );

        if (notification.isCurrent) {
          const nextDate = new Date(notification.date);
          nextDate.setMonth(nextDate.getMonth() + 1);
          await this.prisma.notifications.update({
            where: { id: notification.id },
            data: { date: nextDate },
          });
        } else {
          await this.prisma.notifications.update({
            where: { id: notification.id },
            data: { isCurrent: false },
          });
        }

        sent++;
      }

      return { sent, message: `${sent} notificação(ões) enviada(s)` };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao enviar notificações',
        error.status ?? 500,
      );
    }
  }
}
