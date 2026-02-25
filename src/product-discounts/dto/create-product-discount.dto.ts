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

export enum ProductDiscountAppliesToDto {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  CATEGORY = 'CATEGORY',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
}

export class CreateProductDiscountDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Min(0)
  percentage!: number;

  @IsEnum(ProductDiscountAppliesToDto)
  applies_to!: ProductDiscountAppliesToDto;

  @IsOptional()
  @IsUUID()
  category_id?: string | null;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  /** Required when applies_to is SPECIFIC_PRODUCTS */
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  product_ids?: string[];
}
