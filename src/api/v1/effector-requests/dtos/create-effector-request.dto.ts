import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsEnum, IsNumber, ValidateNested, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEffectorRequestItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  article_code?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  article_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit_measure?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiration_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  technical_specifications?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_unit_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_total_price?: number;
}

export class CreateEffectorRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'], default: 'NORMAL' })
  @IsOptional()
  @IsEnum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE'])
  priority?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  delivery_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  delivery_address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_email?: string;

  @ApiProperty({ type: [CreateEffectorRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEffectorRequestItemDto)
  items: CreateEffectorRequestItemDto[];
} 