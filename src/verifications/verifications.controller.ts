import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { isValidPublicEndpointToken } from '../public-endpoint-token';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { Verification } from './verification.entity';
import { VerificationsService } from './verifications.service';

@Controller('verifications')
export class VerificationsController {
  constructor(
    private readonly verificationsService: VerificationsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(@Headers('authorization') authorization?: string): Promise<Verification[]> {
    await this.assertAdmin(authorization);
    return this.verificationsService.findAll();
  }

  @Get('active')
  async findAllActive(
    @Headers('authorization') authorization?: string,
    @Headers('x-api-token') apiToken?: string,
  ): Promise<Verification[]> {
    this.assertSharedToken(apiToken, authorization);
    return this.verificationsService.findAllActive();
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() createVerificationDto: CreateVerificationDto,
  ): Promise<Verification> {
    await this.assertAdmin(authorization);
    return this.verificationsService.create(createVerificationDto);
  }

  @Put(':id')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVerificationDto: UpdateVerificationDto,
  ): Promise<Verification> {
    await this.assertAdmin(authorization);
    return this.verificationsService.update(id, updateVerificationDto);
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: true }> {
    await this.assertAdmin(authorization);
    await this.verificationsService.remove(id);
    return { success: true };
  }

  private assertSharedToken(
    apiToken?: string,
    authorization?: string,
  ): void {
    const token = authorization?.replace('Bearer ', '').trim() ?? '';
    const session = this.authService.validateToken(token);

    if (session) {
      return;
    }

    if (!isValidPublicEndpointToken(apiToken)) {
      throw new UnauthorizedException('Token fixo inválido ou ausente.');
    }
  }

  private async assertAdmin(authorization?: string): Promise<void> {
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

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso permitido apenas para administrador.');
    }
  }

}
