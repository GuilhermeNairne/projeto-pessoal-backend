import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<UserRepository>;

  const bcryptCompare = bcrypt.compare as unknown as jest.Mock<
    () => Promise<boolean>
  >;
  const bcryptHash = bcrypt.hash as unknown as jest.Mock<() => Promise<string>>;

  const mockUser = {
    id: 'user-id-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    refreshToken: 'hashed-refresh-token',
    profilePicture: 'pic.png',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            updateRefreshToken: jest.fn(),
            registerUser: jest.fn(),
            listUsers: jest.fn(),
            DeleteUser: jest.fn(),
            updateUser: jest.fn(),
            findUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
    userRepository = module.get(UserRepository);

    // Silence the console.log noise from the service's catch blocks.
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns user data and tokens on valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      bcryptHash.mockResolvedValue('hashed-refresh-token');
      userRepository.updateRefreshToken.mockResolvedValue(mockUser as any);

      const result = await service.login({
        email: mockUser.email,
        password: 'plain-password',
      });

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'hashed-refresh-token',
      );
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userRepository.updateRefreshToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: mockUser.email, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('wraps unexpected errors in InternalServerErrorException', async () => {
      userRepository.findByEmail.mockRejectedValue(new Error('db down'));

      await expect(
        service.login({ email: mockUser.email, password: 'x' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('logout', () => {
    it('clears the refresh token for the user', async () => {
      userRepository.updateRefreshToken.mockResolvedValue(mockUser as any);

      await service.logout(mockUser.id);

      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
    });
  });

  describe('refresh', () => {
    it('returns user data and a new access token on a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.id } as any);
      userRepository.findUser.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
        accessToken: 'new-access-token',
      });
    });

    it('throws when no refresh token is provided', async () => {
      await expect(service.refresh('')).rejects.toBeInstanceOf(HttpException);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('throws when the stored token hash does not match', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.id } as any);
      userRepository.findUser.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.refresh('valid-refresh-token'),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('register', () => {
    it('creates a user and returns tokens when the email is available', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptHash
        .mockResolvedValueOnce('hashed-password')
        .mockResolvedValueOnce('hashed-refresh-token');
      userRepository.registerUser.mockResolvedValue(mockUser as any);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      userRepository.updateRefreshToken.mockResolvedValue(mockUser as any);

      const result = await service.register({
        name: mockUser.name,
        email: mockUser.email,
        password: 'plain-password',
        profile_picture: 'pic.png',
      });

      expect(userRepository.registerUser).toHaveBeenCalledWith({
        name: mockUser.name,
        email: mockUser.email,
        password: 'hashed-password',
        profile_picture: 'pic.png',
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.id).toBe(mockUser.id);
    });

    it('throws ConflictException when the email is already registered', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        service.register({
          name: mockUser.name,
          email: mockUser.email,
          password: 'plain-password',
        }),
      ).rejects.toBeInstanceOf(HttpException);
      expect(userRepository.registerUser).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns the list of users', async () => {
      const users = [mockUser];
      userRepository.listUsers.mockResolvedValue(users as any);

      await expect(service.list()).resolves.toBe(users);
    });

    it('wraps repository errors in HttpException', async () => {
      userRepository.listUsers.mockRejectedValue(new Error('db down'));

      await expect(service.list()).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('delete', () => {
    it('delegates to the repository and returns its response', async () => {
      userRepository.DeleteUser.mockResolvedValue(mockUser as any);

      await expect(service.delete(mockUser.id)).resolves.toBe(mockUser);
      expect(userRepository.DeleteUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('update', () => {
    it('delegates to the repository and returns its response', async () => {
      const update = { name: 'New Name' };
      userRepository.updateUser.mockResolvedValue(mockUser as any);

      await expect(service.update(mockUser.id, update)).resolves.toBe(mockUser);
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        update,
      );
    });
  });
});
