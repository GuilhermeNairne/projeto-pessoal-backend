import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../services/auth.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthController } from "./auth.controller";
import { RecoveryPasswordUseCase } from "../useCases/recoveryPassword.useCase";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let recoveryPasswordUseCase: jest.Mocked<RecoveryPasswordUseCase>;

  const buildRes = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            register: jest.fn(),
            list: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            refresh: jest.fn(),
            validateCode: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: RecoveryPasswordUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      // The guard is irrelevant to controller-level unit tests.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    recoveryPasswordUseCase = module.get(RecoveryPasswordUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("sets access and refresh token cookies and returns the user", async () => {
      const res = buildRes();
      authService.login.mockResolvedValue({
        user: { id: "1", name: "John", email: "john@example.com" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      } as any);

      const result = await controller.login(
        { email: "john@example.com", password: "secret" },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        "access-token",
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.any(Object),
      );
      expect(result).toEqual({
        user: { id: "1", name: "John", email: "john@example.com" },
      });
    });
  });

  describe("logout", () => {
    it("clears cookies and calls the service with the user id", async () => {
      const res = buildRes();
      const req = { user: { id: "user-1" } };
      authService.logout.mockResolvedValue(undefined as any);

      await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith("user-1");
      expect(res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );
    });
  });

  describe("register", () => {
    it("delegates to the service and returns its result", async () => {
      const values = {
        name: "John",
        email: "john@example.com",
        password: "secret",
      };
      const created = { user: { id: "1" } };
      authService.register.mockResolvedValue(created as any);

      await expect(controller.register(values)).resolves.toBe(created);
      expect(authService.register).toHaveBeenCalledWith(values);
    });
  });

  describe("me", () => {
    it("returns the authenticated user from the request", () => {
      const req = { user: { id: "1", name: "John" } };

      expect(controller.me(req)).toEqual({ user: req.user });
    });
  });

  describe("list", () => {
    it("returns the service list result", async () => {
      const users = [{ id: "1" }];
      authService.list.mockResolvedValue(users as any);

      await expect(controller.list()).resolves.toBe(users);
    });
  });

  describe("delete", () => {
    it("delegates to the service with the id", async () => {
      authService.delete.mockResolvedValue({ id: "1" } as any);

      await controller.delete("1");

      expect(authService.delete).toHaveBeenCalledWith("1");
    });
  });

  describe("update", () => {
    it("delegates to the service with the id and update payload", async () => {
      const update = { name: "New Name" };
      authService.update.mockResolvedValue({ id: "1" } as any);

      await controller.update("1", update);

      expect(authService.update).toHaveBeenCalledWith("1", update);
    });
  });

  describe("refresh", () => {
    it("reads the refresh token from cookies, sets a new access cookie, and returns the user", async () => {
      const res = buildRes();
      const req = { cookies: { refreshToken: "refresh-token" } };
      authService.refresh.mockResolvedValue({
        user: { id: "1", name: "John", email: "john@example.com" },
        accessToken: "new-access-token",
      } as any);

      const result = await controller.refresh(req, res);

      expect(authService.refresh).toHaveBeenCalledWith("refresh-token");
      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        "new-access-token",
        expect.any(Object),
      );
      expect(result).toEqual({
        user: { id: "1", name: "John", email: "john@example.com" },
      });
    });
  });

  describe("sendEmailPasswordRecovery", () => {
    it("delegates to the use case with the given e-mail", async () => {
      recoveryPasswordUseCase.execute.mockResolvedValue(undefined as any);

      await controller.sendEmailPasswordRecovery("john@example.com");

      expect(recoveryPasswordUseCase.execute).toHaveBeenCalledWith(
        "john@example.com",
      );
    });
  });

  describe("validateCode", () => {
    it("sets the reset password token cookie and returns the remaining result", async () => {
      const res = buildRes();
      authService.validateCode.mockResolvedValue({
        message: "Código válido",
        resetPasswordToken: "reset-password-token",
      } as any);

      const result = await controller.validateCode(
        "john@example.com",
        "123456",
        res,
      );

      expect(authService.validateCode).toHaveBeenCalledWith(
        "john@example.com",
        "123456",
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "resetPasswordToken",
        "reset-password-token",
        expect.any(Object),
      );
      expect(result).toEqual({ message: "Código válido" });
    });
  });

  describe("resetPassword", () => {
    it("reads the reset password token from cookies, clears it and returns the service result", async () => {
      const res = buildRes();
      const req = { cookies: { resetPasswordToken: "reset-password-token" } };
      authService.resetPassword.mockResolvedValue({
        message: "Senha atualizada com sucesso",
      } as any);

      const result = await controller.resetPassword(
        req,
        "new-password",
        res,
      );

      expect(authService.resetPassword).toHaveBeenCalledWith(
        "reset-password-token",
        "new-password",
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "resetPasswordToken",
        expect.any(Object),
      );
      expect(result).toEqual({ message: "Senha atualizada com sucesso" });
    });
  });
});
