import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationDTO, NotificationMethod } from './notification.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { Prisma } from 'src/generated/prisma/client';

type DbClient = PrismaService | Prisma.TransactionClient;

export type TarefaNotificationSource = {
  id: number;
  userId: string;
  nome: string;
  descricao: string | null;
  status: string | null;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]!,
  );
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @Cron('0 8 * * *')
  async handleDailyNotifications() {
    this.logger.log('Executando envio diário de notificações...');
    const result = await this.sendDueNotifications();
    this.logger.log(result.message);
  }

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

  private taskNotificationContent(tarefa: TarefaNotificationSource) {
    return {
      title: tarefa.nome,
      description: tarefa.descricao || `Lembrete da tarefa "${tarefa.nome}"`,
    };
  }

  /**
   * Creates or updates the one-shot e-mail notification linked to a task.
   * A new date (re)arms the notification; keeping the same day leaves its
   * sent/pending state untouched. Completed tasks never stay armed.
   */
  async upsertForTask(
    tarefa: TarefaNotificationSource,
    dataAviso: Date,
    client: DbClient = this.prisma,
  ) {
    const concluida = tarefa.status === 'Concluida';
    const existing = await client.notifications.findUnique({
      where: { tarefaId: tarefa.id },
    });
    const dateChanged = !existing || dayKey(existing.date) !== dayKey(dataAviso);

    if (dateChanged) {
      const today = new Date();
      const startOfToday = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        ),
      );
      if (dataAviso < startOfToday) {
        throw new BadRequestException(
          'A data do aviso deve ser hoje ou posterior',
        );
      }
    }

    const content = this.taskNotificationContent(tarefa);

    if (!existing) {
      return await client.notifications.create({
        data: {
          ...content,
          userId: tarefa.userId,
          date: dataAviso,
          method: NotificationMethod.EMAIL,
          recurring: false,
          isCurrent: !concluida,
          tarefaId: tarefa.id,
        },
      });
    }

    return await client.notifications.update({
      where: { id: existing.id },
      data: {
        ...content,
        ...(dateChanged ? { date: dataAviso, isCurrent: !concluida } : {}),
        ...(concluida ? { isCurrent: false } : {}),
      },
    });
  }

  /**
   * Keeps an existing task notification in sync when the task changes without
   * an explicit notice instruction (rename, completion, ...). No-op when the
   * task has no notification.
   */
  async refreshForTask(
    tarefa: TarefaNotificationSource,
    client: DbClient = this.prisma,
  ) {
    const existing = await client.notifications.findUnique({
      where: { tarefaId: tarefa.id },
    });
    if (!existing) return null;

    return await client.notifications.update({
      where: { id: existing.id },
      data: {
        ...this.taskNotificationContent(tarefa),
        ...(tarefa.status === 'Concluida' ? { isCurrent: false } : {}),
      },
    });
  }

  async removeForTask(tarefaId: number, client: DbClient = this.prisma) {
    return await client.notifications.deleteMany({ where: { tarefaId } });
  }

  async sendTestEmail(to: string) {
    try {
      await this.mailService.sendMail(
        to,
        'Teste - Notificação',
        '<h2>Email de teste</h2><p>Se você recebeu este email, o envio está funcionando corretamente.</p>',
      );
      return { success: true, message: `Email de teste enviado para ${to}` };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao enviar email de teste',
        error.status ?? 500,
      );
    }
  }

  async debugNotifications() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const all = await this.prisma.notifications.findMany({
      where: { isCurrent: true },
    });

    return {
      serverNow: today.toISOString(),
      queryRange: {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
      },
      allCurrentNotifications: all.map((n) => ({
        id: n.id,
        title: n.title,
        date: n.date.toISOString(),
        method: n.method,
        isCurrent: n.isCurrent,
      })),
    };
  }

  async sendDueNotifications() {
    try {
      const today = new Date();
      const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

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
          `<h2>${escapeHtml(notification.title)}</h2><p>${escapeHtml(notification.description)}</p>`,
        );

        if (notification.recurring) {
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
