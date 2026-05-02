import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemCustomizationValueDto {
  @ApiProperty({ example: 'customization-uuid' })
  @IsUUID()
  product_customization_id!: string;

  @ApiPropertyOptional({ description: 'Required when option kind is TEXT' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text_value?: string | null;

  @ApiPropertyOptional({ description: 'Public https URL when option kind is IMAGE' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image_url?: string | null;
}

export class CreateOrderItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  product_id!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsOptional()
  @IsUUID()
  product_variant_id?: string;

  @ApiPropertyOptional({ type: [OrderItemCustomizationValueDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemCustomizationValueDto)
  customizations?: OrderItemCustomizationValueDto[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsUUID()
  customer_id!: string;

  @ApiProperty({ example: 'address-uuid' })
  @IsUUID()
  address_id!: string;

  @ApiProperty({ type: [CreateOrderItemDto], example: [{ product_id: 'product-uuid', quantity: 2 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'SAVE10' })
  @IsOptional()
  @IsString()
  coupon_code?: string;

  @ApiPropertyOptional({ example: '2025-03-01T14:00:00Z', description: 'ISO date string' })
  @IsOptional()
  @IsString()
  scheduled_delivery?: string;
}
