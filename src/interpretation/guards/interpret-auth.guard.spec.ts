import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { mock, instance, when, anything, reset } from "ts-mockito";
import { Request } from "express";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthValidator } from "../../auth/auth.validator";
import { PasswordService } from "../../auth/password.service";
import { User } from "../../users/user.entity";
import { InterpretAuthGuard } from "./interpret-auth.guard";
import { MissingCredentialsException } from "../../auth/exceptions/missing-credentials.exception";

describe("InterpretAuthGuard", () => {
  let guard: InterpretAuthGuard;
  let requestMock: Request;
  const contextMock = {
    switchToHttp: () => ({
      getRequest: () => requestMock,
    }),
  } as ExecutionContext;

  const userRepository = mock<Repository<User>>();
  const authValidator = new AuthValidator();
  const passwordService = new PasswordService();

  beforeEach(async () => {
    reset(userRepository);
    requestMock = {} as Request;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretAuthGuard,
        AuthValidator,
        PasswordService,
        {
          provide: getRepositoryToken(User),
          useValue: instance(userRepository),
        },
      ],
    }).compile();

    guard = module.get(InterpretAuthGuard);
  });

  it("allows request when headers contain valid credentials", async () => {
    const password = "pw123";
    const hashed = passwordService.hash(password);

    requestMock.header = jest.fn((key: string) => {
      if (key === "x-username") return "tester";
      if (key === "x-password") return password;
      return undefined;
    });

    const user = {
      id: "user-1",
      username: "tester",
      passwordHash: hashed,
      isLoggedIn: true,
    } as User;

    when(userRepository.findOne(anything())).thenResolve(user);

    await expect(guard.canActivate(contextMock)).resolves.toBe(true);
  });

  it("throws when headers missing", async () => {
    requestMock.header = jest.fn(() => "");
    when(userRepository.findOne(anything())).thenResolve(null);

    await expect(guard.canActivate(contextMock)).rejects.toBeInstanceOf(
      MissingCredentialsException
    );
  });
});
