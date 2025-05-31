import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsNumber, ValidateNested, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class CreateProviderQuotationItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  request_item_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  unit_price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;

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

export class CreateProviderQuotationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  request_id: string;

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

  @ApiProperty({ type: [CreateProviderQuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProviderQuotationItemDto)
  items: CreateProviderQuotationItemDto[];
} 