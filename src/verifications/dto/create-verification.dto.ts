import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateVerificationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  active: boolean;

  @IsString()
  @IsNotEmpty()
  command: string;

  @IsString()
  @IsNotEmpty()
  expectedOutput: string;
}
