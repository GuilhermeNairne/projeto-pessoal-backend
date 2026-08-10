import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findMany: jest.Mock<any>;
      update: jest.Mock<any>;
    };
    roles: {
      findMany: jest.Mock<any>;
      create: jest.Mock<any>;
      update: jest.Mock<any>;
      delete: jest.Mock<any>;
    };
  };

  const mockUser = {
    id: 'user-id-1',
    name: 'John Doe',
    email: 'john@example.com',
    profilePicture: null,
    roles: [{ id: 1, name: 'USER' }],
    createdAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      roles: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new AdminService(prisma as unknown as PrismaService);
  });

  describe('listUsers', () => {
    it('returns all users ordered by most recent', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.listUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
      expect(result).toEqual([mockUser]);
    });
  });

  describe('listRoles', () => {
    it('returns every role row ordered by name', async () => {
      const roles = [
        { id: 2, name: 'ADMIN' },
        { id: 1, name: 'USER' },
      ];
      prisma.roles.findMany.mockResolvedValue(roles);

      const result = await service.listRoles();

      expect(prisma.roles.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(roles);
    });
  });

  describe('createRole', () => {
    it('creates a role', async () => {
      const role = { id: 1, name: 'ADMIN' };
      prisma.roles.create.mockResolvedValue(role);

      const result = await service.createRole({ name: 'ADMIN' });

      expect(prisma.roles.create).toHaveBeenCalledWith({
        data: { name: 'ADMIN' },
      });
      expect(result).toEqual(role);
    });

    it('throws ConflictException when the role name already exists', async () => {
      prisma.roles.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createRole({ name: 'ADMIN' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('updates a role name', async () => {
      const role = { id: 1, name: 'SUPERVISOR' };
      prisma.roles.update.mockResolvedValue(role);

      const result = await service.updateRole(1, { name: 'SUPERVISOR' });

      expect(prisma.roles.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'SUPERVISOR' },
      });
      expect(result).toEqual(role);
    });

    it('throws NotFoundException when the role does not exist', async () => {
      prisma.roles.update.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.updateRole(999, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when renaming to an existing name', async () => {
      prisma.roles.update.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.updateRole(1, { name: 'ADMIN' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('deleteRole', () => {
    it('deletes a role', async () => {
      const role = { id: 1, name: 'ADMIN' };
      prisma.roles.delete.mockResolvedValue(role);

      const result = await service.deleteRole(1);

      expect(prisma.roles.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(role);
    });

    it('throws NotFoundException when the role does not exist', async () => {
      prisma.roles.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.deleteRole(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('addRole', () => {
    it('connects the role to the user', async () => {
      const updatedUser = { ...mockUser, roles: [{ id: 2, name: 'ADMIN' }] };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.addRole(mockUser.id, 2);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { roles: { connect: { id: 2 } } },
        }),
      );
      expect(result).toEqual(updatedUser);
    });

    it('throws NotFoundException when the user or role does not exist', async () => {
      prisma.user.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.addRole('missing-id', 999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('removeRole', () => {
    it('disconnects the role from the user', async () => {
      const updatedUser = { ...mockUser, roles: [] };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.removeRole(mockUser.id, 1);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { roles: { disconnect: { id: 1 } } },
        }),
      );
      expect(result).toEqual(updatedUser);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.update.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.removeRole('missing-id', 1),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
