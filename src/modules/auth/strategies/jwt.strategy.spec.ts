import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UserRepository } from '../user.repository';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: jest.Mocked<UserRepository>;

  beforeAll(() => {
    // The strategy reads JWT_SECRET in its constructor.
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    userRepository = {
      findUserById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    strategy = new JwtStrategy(userRepository);
  });

  describe('validate', () => {
    it('returns the sanitized user when the user exists', async () => {
      userRepository.findUserById.mockResolvedValue({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: 'hashed',
        refreshToken: 'token',
      } as any);

      const result = await strategy.validate({ sub: '1' });

      expect(userRepository.findUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        id: '1',
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('throws UnauthorizedException when the user is not found', async () => {
      userRepository.findUserById.mockResolvedValue(null);

      await expect(strategy.validate({ sub: 'missing' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
