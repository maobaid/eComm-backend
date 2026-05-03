import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { STORE_SLUG_MAX_LENGTH, STORE_SLUG_REGEX } from '../../stores/store-slug.constants.js';

export class RegisterStoreDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'jane@store.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret1234', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @ApiProperty({ example: "Jane's Shop", maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  store_name!: string;

  @ApiProperty({ example: 'janes-shop', description: 'URL-friendly slug (lowercase, hyphens)' })
  @IsString()
  @MinLength(1)
  @MaxLength(STORE_SLUG_MAX_LENGTH)
  @Matches(STORE_SLUG_REGEX, {
    message: 'store_slug must be lowercase letters, numbers, and hyphens only',
  })
  store_slug!: string;
}
