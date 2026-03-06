import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @ApiProperty({ example: 'KW' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country!: string;

  @ApiProperty({ example: 'Kuwait City' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Hawally' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  block!: string;

  @ApiProperty({ example: 'Main St' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  street!: string;

  @ApiPropertyOptional({ example: '5th' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  avenue?: string | null;

  @ApiProperty({ example: '42' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  building_number!: string;

  @ApiPropertyOptional({ example: 'Apt 1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment_number?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
