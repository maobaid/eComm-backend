import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCustomizationDto {
  /** Allowed for round-trip from GET; ignored on save (definitions are replaced wholesale). */
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsIn(['TEXT', 'IMAGE'])
  kind!: 'TEXT' | 'IMAGE';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ValidateIf((o: CreateProductCustomizationDto) => o.kind === 'TEXT')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  max_chars?: number;

  @ValidateIf((o: CreateProductCustomizationDto) => o.kind === 'TEXT')
  @IsIn(['SINGLE_WORD', 'SENTENCE'])
  text_mode?: 'SINGLE_WORD' | 'SENTENCE';
}

export class CreateProductVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  size?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_override?: number | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  low_stock_threshold?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateProductDto {
  @IsOptional()
  @IsUUID()
  category_id?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  image_url?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(40, { each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(40, { each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => CreateProductCustomizationDto)
  customizations?: CreateProductCustomizationDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  low_stock_threshold?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
