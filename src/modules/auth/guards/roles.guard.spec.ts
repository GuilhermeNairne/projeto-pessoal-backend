import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createContext = (user: unknown): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext({ roles: [] }))).toBe(true);
  });

  it('allows access when the user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(
      guard.canActivate(
        createContext({
          roles: [{ id: 1, name: 'USER' }, { id: 2, name: 'ADMIN' }],
        }),
      ),
    ).toBe(true);
  });

  it('denies access when the user does not have any required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() =>
      guard.canActivate(
        createContext({ roles: [{ id: 1, name: 'USER' }] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('denies access when the request has no user', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
