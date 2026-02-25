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

  @ApiProperty({ example: 'Main St' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  street!: string;

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

  @ApiProperty({ example: 'New York' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string | null;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
