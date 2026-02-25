import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { ProductDiscountAppliesToDto } from './create-product-discount.dto.js';

export class UpdateProductDiscountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percentage?: number;

  @IsOptional()
  @IsEnum(ProductDiscountAppliesToDto)
  applies_to?: ProductDiscountAppliesToDto;

  @IsOptional()
  @IsUUID()
  category_id?: string | null;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  product_ids?: string[];
}
