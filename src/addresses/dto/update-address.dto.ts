import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  street?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  building_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment_number?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
