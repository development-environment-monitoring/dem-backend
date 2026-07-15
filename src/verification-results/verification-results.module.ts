import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MachineAlias } from './machine-alias.entity';
import { Verification } from '../verifications/verification.entity';
import { VerificationResult } from './verification-result.entity';
import { VerificationResultsController } from './verification-results.controller';
import { VerificationResultsService } from './verification-results.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationResult, Verification, MachineAlias]),
    AuthModule,
    UsersModule,
  ],
  controllers: [VerificationResultsController],
  providers: [VerificationResultsService],
})
export class VerificationResultsModule {}
