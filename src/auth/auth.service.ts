import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service';

type SessionInfo = {
  username: string;
};

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, SessionInfo>();

  constructor(private readonly usersService: UsersService) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; username: string; role: 'ADMIN' | 'NORMAL' } | null> {
    const user = await this.usersService.validateCredentials(username, password);

    if (!user) {
      return null;
    }

    const token = randomUUID();
    this.sessions.set(token, { username: user.username });

    return {
      token,
      username: user.username,
      role: user.role,
    };
  }

  validateToken(token: string): { username: string } | null {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    return { username: session.username };
  }
}
