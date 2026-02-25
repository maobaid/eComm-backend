import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertDeliverySettingDto {
  @IsOptional()
  @IsBoolean()
  allow_scheduling?: boolean;

  @IsOptional()
  @IsString()
  default_message?: string | null;
}
