import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Report> {
    const report = await this.reportsRepository.findOne({ where: { id } });

    if (!report) {
      throw new NotFoundException('Relatório não encontrado.');
    }

    return report;
  }

  async create(createReportDto: CreateReportDto): Promise<Report> {
    const sql = createReportDto.sql.trim();
    this.assertReportSqlIsAllowed(sql);

    const report = this.reportsRepository.create({
      name: createReportDto.name.trim(),
      sql,
    });

    return this.reportsRepository.save(report);
  }

  async update(id: number, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);

    if (updateReportDto.name !== undefined) {
      report.name = updateReportDto.name.trim();
    }

    if (updateReportDto.sql !== undefined) {
      const sql = updateReportDto.sql.trim();
      this.assertReportSqlIsAllowed(sql);
      report.sql = sql;
    }

    return this.reportsRepository.save(report);
  }

  async remove(id: number): Promise<void> {
    const result = await this.reportsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Relatório não encontrado.');
    }
  }

  async preview(id: number): Promise<{ rows: unknown[] }> {
    const report = await this.findOne(id);
    const sql = report.sql.trim();

    if (!sql) {
      throw new BadRequestException('SQL do relatório está vazio.');
    }

    this.assertReportSqlIsAllowed(sql);
    const rows = await this.dataSource.query(sql);

    return { rows };
  }

  private assertReportSqlIsAllowed(sql: string): void {
    const normalizedSql = sql
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--.*$/gm, ' ')
      .trim()
      .toLowerCase();

    if (!normalizedSql) {
      throw new BadRequestException('SQL do relatório está vazio.');
    }

    if (!normalizedSql.startsWith('select')) {
      throw new BadRequestException('Somente consultas SELECT são permitidas no relatório.');
    }

    if (/\b(insert|update|delete|merge|drop|alter|create|truncate|replace)\b/.test(normalizedSql)) {
      throw new BadRequestException('Somente consultas SELECT são permitidas no relatório.');
    }

    if (/\busers\b/.test(normalizedSql)) {
      throw new BadRequestException('SQL do relatório não pode acessar a tabela users.');
    }
  }
}
