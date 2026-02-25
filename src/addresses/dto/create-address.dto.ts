import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  building_number!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment_number?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country!: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
