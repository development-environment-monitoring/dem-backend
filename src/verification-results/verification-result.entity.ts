import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Verification } from '../verifications/verification.entity';

@Entity('verification_results')
export class VerificationResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'processed_at', type: 'datetime' })
  processedAt: Date;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  @Column({ name: 'machine_id' })
  machineId: string;

  @Column({ name: 'username' })
  username: string;

  @Column({ name: 'machine_name' })
  machineName: string;

  @Column({ name: 'verification_id' })
  verificationId: number;

  @ManyToOne(() => Verification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_id' })
  verification: Verification;

  @Column({ type: 'varchar', length: 32 })
  result: string;

  @Column({ type: 'text', default: '' })
  output: string;
}
