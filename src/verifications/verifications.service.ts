import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { Verification } from './verification.entity';

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(Verification)
    private readonly verificationsRepository: Repository<Verification>,
  ) {}

  async findAll(): Promise<Verification[]> {
    return this.verificationsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllActive(): Promise<Verification[]> {
    return this.verificationsRepository.find({
      where: {
        active: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(createVerificationDto: CreateVerificationDto): Promise<Verification> {
    const verification = this.verificationsRepository.create(createVerificationDto);
    return this.verificationsRepository.save(verification);
  }

  async update(id: number, updateVerificationDto: UpdateVerificationDto): Promise<Verification> {
    const verification = await this.verificationsRepository.findOne({ where: { id } });

    if (!verification) {
      throw new NotFoundException('Verificação não encontrada.');
    }

    const updatedVerification = this.verificationsRepository.merge(
      verification,
      updateVerificationDto,
    );

    return this.verificationsRepository.save(updatedVerification);
  }

  async remove(id: number): Promise<void> {
    const result = await this.verificationsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Verificação não encontrada.');
    }
  }
}
