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
import { CouponTypeDto } from './create-coupon.dto.js';

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsEnum(CouponTypeDto)
  type?: CouponTypeDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_order_amount?: number | null;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usage_limit?: number | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
