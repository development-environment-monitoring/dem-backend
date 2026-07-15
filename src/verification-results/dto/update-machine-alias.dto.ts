import { IsString, MaxLength } from 'class-validator';

export class UpdateMachineAliasDto {
  @IsString()
  @MaxLength(120)
  alias: string;
}
