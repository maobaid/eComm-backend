import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum CouponTypeDto {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class CreateCouponDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsEnum(CouponTypeDto)
  type!: CouponTypeDto;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_order_amount?: number | null;

  @IsDateString()
  expires_at!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usage_limit?: number | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
