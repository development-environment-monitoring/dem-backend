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
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './report.entity';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(@Headers('authorization') authorization?: string): Promise<Report[]> {
    await this.assertAdmin(authorization);
    return this.reportsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ): Promise<Report> {
    await this.assertAdmin(authorization);
    return this.reportsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createReportDto: CreateReportDto,
    @Headers('authorization') authorization?: string,
  ): Promise<Report> {
    await this.assertAdmin(authorization);
    return this.reportsService.create(createReportDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
    @Headers('authorization') authorization?: string,
  ): Promise<Report> {
    await this.assertAdmin(authorization);
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: true }> {
    await this.assertAdmin(authorization);
    await this.reportsService.remove(id);
    return { success: true };
  }

  @Get(':id/preview')
  async preview(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ): Promise<{ rows: unknown[] }> {
    await this.assertAdmin(authorization);
    return this.reportsService.preview(id);
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
