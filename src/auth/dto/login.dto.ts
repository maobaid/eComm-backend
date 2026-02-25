import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@store.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 1, description: 'Password' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}
