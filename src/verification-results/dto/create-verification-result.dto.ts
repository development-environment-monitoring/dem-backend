import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateVerificationResultDto {
  @IsISO8601()
  processedAt: string;

  @IsString()
  @IsNotEmpty()
  machineId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  machineName: string;

  @IsInt()
  verificationId: number;

  @IsString()
  @IsIn(['success', 'error'])
  result: 'success' | 'error';

  @IsString()
  output: string;
}
