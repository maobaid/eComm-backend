import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../constants.js';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** Required for STORE_ADMIN and STAFF; must be null or omitted for SUPER_ADMIN */
  @IsOptional()
  @IsUUID()
  store_id?: string | null;
}
