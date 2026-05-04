import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

const SUGGEST_THEME_MEDIA = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export class SuggestThemeDto {
  @ApiProperty({
    description: 'Base64-encoded image bytes (no data: URL prefix required; may be sent with or without whitespace)',
    maxLength: 12_000_000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(12_000_000)
  image!: string;

  @ApiProperty({ example: 'image/png', enum: SUGGEST_THEME_MEDIA })
  @IsString()
  @IsIn([...SUGGEST_THEME_MEDIA])
  mediaType!: (typeof SUGGEST_THEME_MEDIA)[number];
}
