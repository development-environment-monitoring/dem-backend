import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { CreateVerificationResultDto } from './dto/create-verification-result.dto';
import { UpdateMachineAliasDto } from './dto/update-machine-alias.dto';
import { VerificationResult } from './verification-result.entity';
import {
  DeviceSummary,
  VerificationResultsService,
} from './verification-results.service';

@Controller('verification-results')
export class VerificationResultsController {
  constructor(
    private readonly verificationResultsService: VerificationResultsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(
    @Headers('authorization') authorization?: string,
  ): Promise<VerificationResult[]> {
    await this.assertAdmin(authorization);
    return this.verificationResultsService.findAll();
  }

  @Post()
  async create(
    @Body() createVerificationResultDto: CreateVerificationResultDto,
  ): Promise<VerificationResult> {
    return this.verificationResultsService.create(createVerificationResultDto);
  }

  @Get('devices')
  async findDevices(
    @Headers('authorization') authorization?: string,
  ): Promise<DeviceSummary[]> {
    await this.assertAdmin(authorization);
    return this.verificationResultsService.findDevices();
  }

  @Put('devices/:machineId/alias')
  async updateMachineAlias(
    @Param('machineId') machineId: string,
    @Body() updateMachineAliasDto: UpdateMachineAliasDto,
    @Headers('authorization') authorization?: string,
  ): Promise<{ machineId: string; alias: string | null }> {
    await this.assertAdmin(authorization);
    const alias = await this.verificationResultsService.updateMachineAlias(
      machineId,
      updateMachineAliasDto.alias,
    );

    return {
      machineId,
      alias: alias?.alias ?? null,
    };
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
