import { IsIn, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['ADMIN', 'NORMAL'])
  role: 'ADMIN' | 'NORMAL';
}
