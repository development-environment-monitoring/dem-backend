import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateVerificationDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsBoolean()
	active?: boolean;

	@IsOptional()
	@IsString()
	command?: string;

	@IsOptional()
	@IsString()
	expectedOutput?: string;
}
