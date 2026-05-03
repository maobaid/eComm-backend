import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Partial theme update; omit a field to leave it unchanged. Send empty string to clear a nullable field. */
export class UpdateStoreThemeDto {
  @ApiPropertyOptional({ example: '#111111' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  primary_color?: string;

  @ApiPropertyOptional({ example: '#222222' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  secondary_color?: string;

  @ApiPropertyOptional({ example: '#ff6600' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  accent_color?: string;

  @ApiPropertyOptional({ example: '#ffff00' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  highlight_color?: string;

  @ApiPropertyOptional({
    description: 'Public URL for the store logo (e.g. from your image upload flow)',
    example: 'https://api.example.com/public/customization-uploads/.../logo.webp',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo_url?: string;

  @ApiPropertyOptional({ example: 'Inter, system-ui, sans-serif' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  font_family?: string;
}
