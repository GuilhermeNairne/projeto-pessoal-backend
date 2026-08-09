import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { RecoveryPasswordUseCase } from "./recoveryPassword.useCase";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";

jest.mock("bcrypt");
jest.mock("crypto", () => ({
  randomInt: jest.fn(),
}));

const { randomInt } = jest.requireMock("crypto") as {
  randomInt: jest.Mock<() => number>;
};

describe("RecoveryPasswordUseCase", () => {
  let useCase: RecoveryPasswordUseCase;
  let authService: jest.Mocked<AuthService>;
  let userRepository: jest.Mocked<UserRepository>;

  const bcryptHash = bcrypt.hash as unknown as jest.Mock<() => Promise<string>>;

  const mockUser = {
    id: "user-id-1",
    name: "John Doe",
    email: "john@example.com",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecoveryPasswordUseCase,
        {
          provide: AuthService,
          useValue: {
            sendEmailPasswordRecovery: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            setPasswordCodeRecovery: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(RecoveryPasswordUseCase);
    authService = module.get(AuthService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("hashes a generated code, stores it and sends the recovery e-mail", async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser as any);
    randomInt.mockReturnValue(123456);
    bcryptHash.mockResolvedValue("hashed-code");
    userRepository.setPasswordCodeRecovery.mockResolvedValue(mockUser as any);
    authService.sendEmailPasswordRecovery.mockResolvedValue(undefined);

    await useCase.execute(mockUser.email);

    expect(bcryptHash).toHaveBeenCalledWith("123456", 10);
    expect(userRepository.setPasswordCodeRecovery).toHaveBeenCalledWith(
      mockUser.email,
      "hashed-code",
    );
    expect(authService.sendEmailPasswordRecovery).toHaveBeenCalledWith(
      123456,
      mockUser.email,
    );
  });

  it("throws an HttpException when the e-mail does not belong to a user", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute("nobody@example.com")).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(userRepository.setPasswordCodeRecovery).not.toHaveBeenCalled();
    expect(authService.sendEmailPasswordRecovery).not.toHaveBeenCalled();
  });

  it("wraps repository errors in an HttpException", async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser as any);
    randomInt.mockReturnValue(123456);
    bcryptHash.mockResolvedValue("hashed-code");
    userRepository.setPasswordCodeRecovery.mockRejectedValue(
      new Error("db down"),
    );

    await expect(useCase.execute(mockUser.email)).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(authService.sendEmailPasswordRecovery).not.toHaveBeenCalled();
  });

  it("wraps mail sending errors in an HttpException", async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser as any);
    randomInt.mockReturnValue(123456);
    bcryptHash.mockResolvedValue("hashed-code");
    userRepository.setPasswordCodeRecovery.mockResolvedValue(mockUser as any);
    authService.sendEmailPasswordRecovery.mockRejectedValue(
      new HttpException("Erro ao validar e-mail", 500),
    );

    await expect(useCase.execute(mockUser.email)).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
