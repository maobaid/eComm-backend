import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { STORE_SLUG_MAX_LENGTH, STORE_SLUG_REGEX } from '../store-slug.constants.js';

export class CreateStoreDto {
  @ApiProperty({ example: 'My Store' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'my-store', description: 'URL-friendly unique slug' })
  @IsString()
  @MinLength(1)
  @MaxLength(STORE_SLUG_MAX_LENGTH)
  @Matches(STORE_SLUG_REGEX, {
    message: 'slug must be lowercase letters, numbers, and hyphens only',
  })
  slug!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
