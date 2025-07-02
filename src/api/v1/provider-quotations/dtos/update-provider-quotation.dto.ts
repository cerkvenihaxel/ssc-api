import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString, IsNumber, ValidateNested, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateProviderQuotationItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  quotation_item_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  request_item_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  unit_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  delivery_time_days?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateProviderQuotationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  delivery_time_days?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  delivery_terms?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payment_terms?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warranty_terms?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiProperty({ type: [UpdateProviderQuotationItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProviderQuotationItemDto)
  items?: UpdateProviderQuotationItemDto[];
} 