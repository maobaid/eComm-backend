import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

// Keep in sync with Prisma enum OrderStatus
export enum OrderStatusDto {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatusDto, example: OrderStatusDto.CONFIRMED })
  @IsEnum(OrderStatusDto)
  status!: OrderStatusDto;
}

