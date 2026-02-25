import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  product_id!: string;

  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  customer_id!: string;

  @IsUUID()
  address_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  coupon_code?: string;

  @IsOptional()
  @IsString()
  scheduled_delivery?: string;
}
