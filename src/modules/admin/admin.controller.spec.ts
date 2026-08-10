import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            listUsers: jest.fn(),
            listRoles: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            deleteRole: jest.fn(),
            addRole: jest.fn(),
            removeRole: jest.fn(),
          },
        },
      ],
    })
      // Guards are irrelevant to controller-level unit tests.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminController);
    adminService = module.get(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists users', async () => {
    const users = [{ id: '1', name: 'John', email: 'john@example.com' }];
    adminService.listUsers.mockResolvedValue(users as any);

    await expect(controller.listUsers()).resolves.toEqual(users);
  });

  it('lists roles', async () => {
    const roles = [{ id: 1, name: 'ADMIN' }];
    adminService.listRoles.mockResolvedValue(roles as any);

    await expect(controller.listRoles()).resolves.toEqual(roles);
  });

  it('creates a role', async () => {
    const role = { id: 1, name: 'ADMIN' };
    adminService.createRole.mockResolvedValue(role as any);

    const result = await controller.createRole({ name: 'ADMIN' });

    expect(adminService.createRole).toHaveBeenCalledWith({ name: 'ADMIN' });
    expect(result).toEqual(role);
  });

  it('updates a role', async () => {
    const role = { id: 1, name: 'SUPERVISOR' };
    adminService.updateRole.mockResolvedValue(role as any);

    const result = await controller.updateRole(1, { name: 'SUPERVISOR' });

    expect(adminService.updateRole).toHaveBeenCalledWith(1, {
      name: 'SUPERVISOR',
    });
    expect(result).toEqual(role);
  });

  it('deletes a role', async () => {
    const role = { id: 1, name: 'ADMIN' };
    adminService.deleteRole.mockResolvedValue(role as any);

    const result = await controller.deleteRole(1);

    expect(adminService.deleteRole).toHaveBeenCalledWith(1);
    expect(result).toEqual(role);
  });

  it('adds a role to a user', async () => {
    const updatedUser = { id: '1', roles: [{ id: 2, name: 'ADMIN' }] };
    adminService.addRole.mockResolvedValue(updatedUser as any);

    const result = await controller.addRole('1', { roleId: 2 });

    expect(adminService.addRole).toHaveBeenCalledWith('1', 2);
    expect(result).toEqual(updatedUser);
  });

  it('removes a role from a user', async () => {
    const updatedUser = { id: '1', roles: [] };
    adminService.removeRole.mockResolvedValue(updatedUser as any);

    const result = await controller.removeRole('1', 2);

    expect(adminService.removeRole).toHaveBeenCalledWith('1', 2);
    expect(result).toEqual(updatedUser);
  });
});
