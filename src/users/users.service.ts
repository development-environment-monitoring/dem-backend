import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByUsernameCaseInsensitive(username: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();
  }

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByUsernameCaseInsensitive(username.trim());

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async register(username: string, password: string): Promise<User> {
    const normalizedUsername = username.trim();
    const existing = await this.findByUsernameCaseInsensitive(normalizedUsername);

    if (existing) {
      throw new ConflictException('Já existe usuário com este nome.');
    }

    const usersCount = await this.usersRepository.count();
    const role = usersCount === 0 ? 'ADMIN' : 'NORMAL';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      username: normalizedUsername,
      passwordHash,
      role,
    });

    return this.usersRepository.save(user);
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.findByUsername(username);

    if (!user) {
      return false;
    }

    const isValidCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isValidCurrentPassword) {
      return false;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);

    return true;
  }

  async findAllUsers(): Promise<Array<{ id: number; username: string; role: 'ADMIN' | 'NORMAL' }>> {
    const users = await this.usersRepository.find({
      select: {
        id: true,
        username: true,
        role: true,
      },
      order: {
        username: 'ASC',
      },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
    }));
  }

  async updateUserRole(
    targetUserId: number,
    newRole: 'ADMIN' | 'NORMAL',
  ): Promise<{ id: number; username: string; role: 'ADMIN' | 'NORMAL' }> {
    const user = await this.usersRepository.findOne({ where: { id: targetUserId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.role === newRole) {
      return { id: user.id, username: user.username, role: user.role };
    }

    if (user.role === 'ADMIN' && newRole === 'NORMAL') {
      const adminsCount = await this.usersRepository.count({ where: { role: 'ADMIN' } });

      if (adminsCount <= 1) {
        throw new BadRequestException(
          'Não é permitido remover o último administrador.',
        );
      }
    }

    user.role = newRole;
    const saved = await this.usersRepository.save(user);

    return { id: saved.id, username: saved.username, role: saved.role };
  }

}
