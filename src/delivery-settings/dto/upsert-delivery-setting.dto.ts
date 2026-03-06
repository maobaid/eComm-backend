import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertDeliverySettingDto {
  @IsOptional()
  @IsBoolean()
  allow_scheduling?: boolean;

  @IsOptional()
  @IsString()
  default_message?: string | null;

  /** Default country (e.g. "KW") for address forms */
  @IsOptional()
  @IsString()
  default_country?: string | null;

  /** JSON array of country codes allowed for delivery, e.g. ["KW","SA","BH"]. Null = only default_country or all. */
  @IsOptional()
  @IsString()
  allowed_countries?: string | null;
}
