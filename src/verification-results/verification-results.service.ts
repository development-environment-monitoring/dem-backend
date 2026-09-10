import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Verification } from '../verifications/verification.entity';
import { MachineAlias } from './machine-alias.entity';
import { CreateVerificationResultDto } from './dto/create-verification-result.dto';
import { VerificationResult } from './verification-result.entity';

export type DeviceSummary = {
  machineId: string;
  username: string;
  machineName: string;
  alias: string | null;
  lastReceivedAt: Date;
};

@Injectable()
export class VerificationResultsService {
  constructor(
    @InjectRepository(VerificationResult)
    private readonly verificationResultsRepository: Repository<VerificationResult>,
    @InjectRepository(Verification)
    private readonly verificationsRepository: Repository<Verification>,
    @InjectRepository(MachineAlias)
    private readonly machineAliasesRepository: Repository<MachineAlias>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createVerificationResultDto: CreateVerificationResultDto,
  ): Promise<VerificationResult> {
    const verification = await this.verificationsRepository.findOne({
      where: { id: createVerificationResultDto.verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verificação não encontrada.');
    }

    const verificationResult = this.verificationResultsRepository.create({
      processedAt: new Date(createVerificationResultDto.processedAt),
      machineId: createVerificationResultDto.machineId,
      username: createVerificationResultDto.username,
      machineName: createVerificationResultDto.machineName,
      verificationId: createVerificationResultDto.verificationId,
      result: createVerificationResultDto.result,
      output: createVerificationResultDto.output,
    });

    // Always insert a new execution result row (never update existing ones).
    return this.verificationResultsRepository.save(verificationResult);
  }

  async findAll(): Promise<VerificationResult[]> {
    if (this.dataSource.options.type === 'postgres') {
      return this.verificationResultsRepository
        .createQueryBuilder('result')
        .distinctOn(['result.machineId', 'result.verificationId'])
        .leftJoinAndSelect('result.verification', 'verification')
        .orderBy('result.machineId', 'ASC')
        .addOrderBy('result.verificationId', 'ASC')
        .addOrderBy('result.receivedAt', 'DESC')
        .addOrderBy('result.id', 'DESC')
        .getMany();
    }

    const rankedResults = this.verificationResultsRepository
      .createQueryBuilder('ranked_result')
      .select('ranked_result.id', 'id')
      .addSelect(
        `ROW_NUMBER() OVER (
          PARTITION BY ranked_result.machine_id, ranked_result.verification_id
          ORDER BY ranked_result.receivedAt DESC, ranked_result.id DESC
        )`,
        'row_number',
      );

    return this.verificationResultsRepository
      .createQueryBuilder('result')
      .innerJoin(
        `(${rankedResults.getQuery()})`,
        'latest_result',
        'latest_result.id = result.id AND latest_result.row_number = 1',
      )
      .leftJoinAndSelect('result.verification', 'verification')
      .orderBy('result.receivedAt', 'DESC')
      .getMany();
  }

  async findDevices(): Promise<DeviceSummary[]> {
    const query = this.verificationResultsRepository
      .createQueryBuilder('result')
      .leftJoin(
        MachineAlias,
        'machine_alias',
        'machine_alias.machineId = result.machineId',
      )
      .select('result.machineId', 'machineId')
      .addSelect('result.username', 'username')
      .addSelect('result.machineName', 'machineName')
      .addSelect('machine_alias.alias', 'alias')
      .addSelect('result.receivedAt', 'lastReceivedAt');

    if (this.dataSource.options.type === 'postgres') {
      return query
        .distinctOn(['result.machineId'])
        .orderBy('result.machineId', 'ASC')
        .addOrderBy('result.receivedAt', 'DESC')
        .addOrderBy('result.id', 'DESC')
        .getRawMany<DeviceSummary>();
    }

    const rankedResults = this.verificationResultsRepository
      .createQueryBuilder('ranked_result')
      .select('ranked_result.id', 'id')
      .addSelect(
        `ROW_NUMBER() OVER (
          PARTITION BY ranked_result.machine_id
          ORDER BY ranked_result.receivedAt DESC, ranked_result.id DESC
        )`,
        'row_number',
      );

    return query
      .innerJoin(
        `(${rankedResults.getQuery()})`,
        'latest_result',
        'latest_result.id = result.id AND latest_result.row_number = 1',
      )
      .orderBy('result.machineId', 'ASC')
      .getRawMany<DeviceSummary>();
  }

  async updateMachineAlias(
    machineId: string,
    alias: string,
  ): Promise<MachineAlias | null> {
    const normalizedMachineId = machineId.trim();
    const normalizedAlias = alias.trim();

    if (!normalizedMachineId) {
      throw new NotFoundException('Machine ID inválido.');
    }

    if (!normalizedAlias) {
      await this.machineAliasesRepository.delete({
        machineId: normalizedMachineId,
      });
      return null;
    }

    const existing = await this.machineAliasesRepository.findOne({
      where: { machineId: normalizedMachineId },
    });

    if (existing) {
      existing.alias = normalizedAlias;
      return this.machineAliasesRepository.save(existing);
    }

    const created = this.machineAliasesRepository.create({
      machineId: normalizedMachineId,
      alias: normalizedAlias,
    });

    return this.machineAliasesRepository.save(created);
  }
}
