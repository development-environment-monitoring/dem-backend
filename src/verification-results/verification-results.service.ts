import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return this.verificationResultsRepository.find({
      relations: {
        verification: true,
      },
      order: {
        receivedAt: 'DESC',
      },
    });
  }

  async findDevices(): Promise<DeviceSummary[]> {
    const [results, aliases] = await Promise.all([
      this.verificationResultsRepository.find({
        order: {
          receivedAt: 'DESC',
        },
      }),
      this.machineAliasesRepository.find(),
    ]);

    const aliasByMachineId = new Map(
      aliases.map((machineAlias) => [machineAlias.machineId, machineAlias.alias]),
    );

    const latestByMachineId = new Map<string, DeviceSummary>();

    for (const row of results) {
      const machineId = row.machineId?.trim();

      if (!machineId || latestByMachineId.has(machineId)) {
        continue;
      }

      latestByMachineId.set(machineId, {
        machineId,
        username: row.username,
        machineName: row.machineName,
        alias: aliasByMachineId.get(machineId) ?? null,
        lastReceivedAt: row.receivedAt,
      });
    }

    return Array.from(latestByMachineId.values());
  }

  async updateMachineAlias(machineId: string, alias: string): Promise<MachineAlias | null> {
    const normalizedMachineId = machineId.trim();
    const normalizedAlias = alias.trim();

    if (!normalizedMachineId) {
      throw new NotFoundException('Machine ID inválido.');
    }

    if (!normalizedAlias) {
      await this.machineAliasesRepository.delete({ machineId: normalizedMachineId });
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
