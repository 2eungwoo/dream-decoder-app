import { Injectable } from '@nestjs/common';
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception';
import { MissingCredentialsException } from './exceptions/missing-credentials.exception';
import { UserNotLoggedInException } from './exceptions/user-not-logged-in.exception';
import { UsernameTakenException } from './exceptions/username-taken.exception';
import { User } from '../users/user.entity';

@Injectable()
export class AuthValidator {
  public ensureCredentials(username?: string, password?: string) {
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      throw new MissingCredentialsException();
    }

    return {
      username: trimmedUsername,
      password: password ?? '',
    };
  }

  public ensureUsernameAvailable(isTaken: boolean, username: string) {
    if (isTaken) {
      throw new UsernameTakenException(username);
    }
  }

  public ensureUserExists(user: User | null | undefined) {
    if (!user) {
      throw new InvalidCredentialsException();
    }
    return user;
  }

  public ensurePasswordValid(isValid: boolean) {
    if (!isValid) {
      throw new InvalidCredentialsException();
    }
  }

  public ensureUserLoggedIn(isLoggedIn: boolean) {
    if (!isLoggedIn) {
      throw new UserNotLoggedInException();
    }
  }
}
