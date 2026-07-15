import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ token: string; role: 'ADMIN' | 'NORMAL' }> {
    const result = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );

    if (!result) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    return {
      token: result.token,
      role: result.role,
    };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ username: string; role: 'ADMIN' | 'NORMAL' }> {
    const user = await this.usersService.register(
      registerDto.username,
      registerDto.password,
    );

    return {
      username: user.username,
      role: user.role,
    };
  }

  @Get('me')
  async getCurrentUser(
    @Headers('authorization') authorization?: string,
  ): Promise<{
    username: string;
    role: 'ADMIN' | 'NORMAL';
  }> {
    const session = await this.assertAuthenticated(authorization);

    return { username: session.username, role: session.role };
  }

  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: true }> {
    const session = await this.assertAuthenticated(authorization);

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    const changed = await this.usersService.changePassword(
      session.username,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    if (!changed) {
      throw new UnauthorizedException('Senha atual inválida.');
    }

    return { success: true };
  }

  @Get('users')
  async findAllUsers(
    @Headers('authorization') authorization?: string,
  ): Promise<Array<{ id: number; username: string; role: 'ADMIN' | 'NORMAL' }>> {
    await this.assertAdmin(authorization);
    return this.usersService.findAllUsers();
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Headers('authorization') authorization?: string,
  ): Promise<{ id: number; username: string; role: 'ADMIN' | 'NORMAL' }> {
    await this.assertAdmin(authorization);
    return this.usersService.updateUserRole(id, updateUserRoleDto.role);
  }

  private async assertAdmin(authorization?: string): Promise<void> {
    const session = await this.assertAuthenticated(authorization);

    if (session.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso permitido apenas para administrador.');
    }
  }

  private async assertAuthenticated(
    authorization?: string,
  ): Promise<{ username: string; role: 'ADMIN' | 'NORMAL' }> {
    const token = authorization?.replace('Bearer ', '').trim() ?? '';
    const session = this.authService.validateToken(token);

    if (!session) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const user = await this.usersService.findByUsernameCaseInsensitive(
      session.username,
    );

    if (!user) {
      throw new UnauthorizedException('Usuário da sessão não encontrado.');
    }

    return { username: user.username, role: user.role };
  }
}
