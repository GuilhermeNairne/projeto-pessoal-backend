import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import type { TarefasDTO } from './tarefas.dto';

describe('TarefasService - task notifications', () => {
  let service: TarefasService;
  let tx: {
    tarefas: { create: jest.Mock<any>; update: jest.Mock<any> };
  };
  let prisma: { $transaction: jest.Mock<any> };
  let notificationService: {
    upsertForTask: jest.Mock<any>;
    refreshForTask: jest.Mock<any>;
    removeForTask: jest.Mock<any>;
  };

  const tarefa = {
    id: 10,
    userId: 'user-1',
    nome: 'Pagar conta',
    descricao: null,
    status: 'Pendente',
    tempo: 0,
    categoriaId: 1,
  };
  const dataAviso = new Date('2999-01-10T00:00:00.000Z');

  const createBody = (extra: Partial<TarefasDTO> = {}): TarefasDTO =>
    ({
      nome: 'Pagar conta',
      status: 'Pendente',
      userId: 'user-1',
      categoriaId: 1,
      tempo: 0,
      data: new Date('2999-01-05T00:00:00.000Z'),
      ...extra,
    }) as TarefasDTO;

  beforeEach(() => {
    tx = {
      tarefas: {
        create: jest.fn<any>().mockResolvedValue(tarefa),
        update: jest.fn<any>().mockResolvedValue(tarefa),
      },
    };
    prisma = {
      $transaction: jest.fn<any>((fn: any) => fn(tx)),
    };
    notificationService = {
      upsertForTask: jest.fn<any>().mockResolvedValue({ id: 99 }),
      refreshForTask: jest.fn<any>().mockResolvedValue(null),
      removeForTask: jest.fn<any>().mockResolvedValue({ count: 1 }),
    };

    service = new TarefasService(
      prisma as unknown as PrismaService,
      notificationService as unknown as NotificationService,
    );
  });

  describe('createTarefa', () => {
    it('creates the task and its notification in one transaction', async () => {
      const result = await service.createTarefa(
        createBody({ enviarAviso: true, dataAviso }),
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(notificationService.upsertForTask).toHaveBeenCalledWith(
        tarefa,
        dataAviso,
        tx,
      );
      expect(result).toEqual({ ...tarefa, notificacao: { id: 99 } });
    });

    it('does not pass the notice fields to Prisma', async () => {
      await service.createTarefa(createBody({ enviarAviso: true, dataAviso }));

      const { data } = tx.tarefas.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data).not.toHaveProperty('enviarAviso');
      expect(data).not.toHaveProperty('dataAviso');
    });

    it('skips the notification when "enviarAviso" is not set', async () => {
      const result = await service.createTarefa(createBody());

      expect(notificationService.upsertForTask).not.toHaveBeenCalled();
      expect(result.notificacao).toBeNull();
    });

    it('propagates notification errors so the transaction rolls back', async () => {
      notificationService.upsertForTask.mockRejectedValue(
        new HttpException('A data do aviso deve ser hoje ou posterior', 400),
      );

      await expect(
        service.createTarefa(createBody({ enviarAviso: true, dataAviso })),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('patchTarefa', () => {
    it('creates/updates the notification when "enviarAviso" is true', async () => {
      const result = await service.patchTarefa(10, {
        nome: 'Pagar conta',
        categoriaId: 1,
        enviarAviso: true,
        // JSON bodies reach the service as strings
        dataAviso: '2999-01-10' as unknown as Date,
      });

      expect(notificationService.upsertForTask).toHaveBeenCalledWith(
        tarefa,
        new Date('2999-01-10'),
        tx,
      );
      expect(result.notificacao).toEqual({ id: 99 });
    });

    it('removes the notification when "enviarAviso" is false', async () => {
      const result = await service.patchTarefa(10, {
        categoriaId: 1,
        enviarAviso: false,
      });

      expect(notificationService.removeForTask).toHaveBeenCalledWith(10, tx);
      expect(notificationService.upsertForTask).not.toHaveBeenCalled();
      expect(result.notificacao).toBeNull();
    });

    it('refreshes the existing notification when the notice is not mentioned', async () => {
      await service.patchTarefa(10, { status: 'Concluida' });

      expect(notificationService.refreshForTask).toHaveBeenCalledWith(
        tarefa,
        tx,
      );
    });

    it('rejects "enviarAviso" without a valid date', async () => {
      await expect(
        service.patchTarefa(10, { enviarAviso: true }),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        service.patchTarefa(10, {
          enviarAviso: true,
          dataAviso: 'not-a-date' as unknown as Date,
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('does not send NaN as categoriaId when it is omitted', async () => {
      await service.patchTarefa(10, { status: 'Concluida' });

      const { data } = tx.tarefas.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data).not.toHaveProperty('categoriaId');
    });
  });
});
