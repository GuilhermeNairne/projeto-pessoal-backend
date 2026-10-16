import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const daysFromNow = (days: number) => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
};

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: {
    notifications: {
      findUnique: jest.Mock<any>;
      findMany: jest.Mock<any>;
      create: jest.Mock<any>;
      update: jest.Mock<any>;
      deleteMany: jest.Mock<any>;
    };
    user: { findMany: jest.Mock<any> };
  };
  let mailService: { sendMail: jest.Mock<any> };

  const tarefa = {
    id: 10,
    userId: 'user-1',
    nome: 'Pagar conta',
    descricao: 'Conta de luz' as string | null,
    status: 'Pendente' as string | null,
  };

  beforeEach(() => {
    prisma = {
      notifications: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: { findMany: jest.fn() },
    };
    mailService = { sendMail: jest.fn() };

    service = new NotificationService(
      prisma as unknown as PrismaService,
      mailService as unknown as MailService,
    );
  });

  describe('upsertForTask', () => {
    it('creates a one-shot EMAIL notification linked to the task', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);
      const date = daysFromNow(3);

      await service.upsertForTask(tarefa, date);

      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: {
          title: 'Pagar conta',
          description: 'Conta de luz',
          userId: 'user-1',
          date,
          method: 'EMAIL',
          recurring: false,
          isCurrent: true,
          tarefaId: 10,
        },
      });
    });

    it('falls back to a generated description when the task has none', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      await service.upsertForTask({ ...tarefa, descricao: null }, daysFromNow(1));

      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Lembrete da tarefa "Pagar conta"',
        }),
      });
    });

    it('accepts today as the notice date', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      await service.upsertForTask(tarefa, daysFromNow(0));

      expect(prisma.notifications.create).toHaveBeenCalled();
    });

    it('rejects a notice date in the past', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertForTask(tarefa, daysFromNow(-1)),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.notifications.create).not.toHaveBeenCalled();
    });

    it('re-arms the notification when the date changes', async () => {
      prisma.notifications.findUnique.mockResolvedValue({
        id: 5,
        date: daysFromNow(1),
        isCurrent: false,
      });
      const newDate = daysFromNow(7);

      await service.upsertForTask(tarefa, newDate);

      expect(prisma.notifications.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          title: 'Pagar conta',
          description: 'Conta de luz',
          date: newDate,
          isCurrent: true,
        },
      });
    });

    it('keeps the sent state and skips the past-date check when the day is unchanged', async () => {
      const sentDate = daysFromNow(-5);
      prisma.notifications.findUnique.mockResolvedValue({
        id: 5,
        date: sentDate,
        isCurrent: false,
      });

      await service.upsertForTask(tarefa, sentDate);

      const { data } = prisma.notifications.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data).not.toHaveProperty('date');
      expect(data).not.toHaveProperty('isCurrent');
    });

    it('does not arm the notification for a completed task', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      await service.upsertForTask(
        { ...tarefa, status: 'Concluida' },
        daysFromNow(2),
      );

      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isCurrent: false }),
      });
    });

    it('uses the provided transaction client instead of the default one', async () => {
      const tx = {
        notifications: {
          findUnique: jest.fn<any>().mockResolvedValue(null),
          create: jest.fn<any>(),
        },
      };

      await service.upsertForTask(tarefa, daysFromNow(1), tx as any);

      expect(tx.notifications.create).toHaveBeenCalled();
      expect(prisma.notifications.create).not.toHaveBeenCalled();
    });
  });

  describe('refreshForTask', () => {
    it('does nothing when the task has no notification', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      const result = await service.refreshForTask(tarefa);

      expect(result).toBeNull();
      expect(prisma.notifications.update).not.toHaveBeenCalled();
    });

    it('syncs title/description without touching the date', async () => {
      prisma.notifications.findUnique.mockResolvedValue({ id: 5 });

      await service.refreshForTask({ ...tarefa, nome: 'Novo nome' });

      expect(prisma.notifications.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { title: 'Novo nome', description: 'Conta de luz' },
      });
    });

    it('disables the notification when the task is completed', async () => {
      prisma.notifications.findUnique.mockResolvedValue({ id: 5 });

      await service.refreshForTask({ ...tarefa, status: 'Concluida' });

      expect(prisma.notifications.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: expect.objectContaining({ isCurrent: false }),
      });
    });
  });

  describe('removeForTask', () => {
    it('deletes the notification linked to the task', async () => {
      await service.removeForTask(10);

      expect(prisma.notifications.deleteMany).toHaveBeenCalledWith({
        where: { tarefaId: 10 },
      });
    });
  });

  describe('sendDueNotifications', () => {
    const base = {
      userId: 'user-1',
      title: 'Aviso',
      description: 'Descrição',
      date: new Date(),
      isCurrent: true,
    };

    beforeEach(() => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'a@b.com', name: 'A' },
      ]);
    });

    it('moves recurring notifications one month ahead', async () => {
      prisma.notifications.findMany.mockResolvedValue([
        { ...base, id: 1, recurring: true },
      ]);

      await service.sendDueNotifications();

      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
      const { data } = prisma.notifications.update.mock.calls[0][0] as {
        data: { date?: Date; isCurrent?: boolean };
      };
      expect(data.date).toBeInstanceOf(Date);
      expect(data).not.toHaveProperty('isCurrent');
    });

    it('deactivates one-shot notifications after sending', async () => {
      prisma.notifications.findMany.mockResolvedValue([
        { ...base, id: 2, recurring: false, tarefaId: 10 },
      ]);

      await service.sendDueNotifications();

      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
      expect(prisma.notifications.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isCurrent: false },
      });
    });
  });
});
