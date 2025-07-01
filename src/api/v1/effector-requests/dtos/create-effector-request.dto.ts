import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsEnum, IsNumber, ValidateNested, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEffectorRequestItemDto {
  @ApiProperty({ required: false, description: 'ID del artículo del depósito' })
  @IsOptional()
  @IsString()
  article_id?: string;

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

  @ApiProperty({ required: false, description: 'Precio unitario estimado' })
  @IsOptional()
  @IsNumber()
  estimated_unit_price?: number;

  @ApiProperty({ required: false, description: 'Precio total estimado' })
  @IsOptional()
  @IsNumber()
  estimated_total_price?: number;

  @ApiProperty({ required: false, description: 'Justificación del artículo solicitado' })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class CreateEffectorRequestDto {
  @ApiProperty({ required: false, description: 'ID del efector (solo para admins)' })
  @IsOptional()
  @IsString()
  effector_id?: string;

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

  @ApiProperty({ required: false, description: 'Departamento o área del efector' })
  @IsOptional()
  @IsString()
  institution_department?: string;

  @ApiProperty({ required: false, description: 'Justificación institucional del pedido' })
  @IsOptional()
  @IsString()
  institutional_justification?: string;

  @ApiProperty({ required: false, description: 'Beneficiarios estimados' })
  @IsOptional()
  @IsNumber()
  estimated_beneficiaries?: number;

  @ApiProperty({ required: false, description: 'Contexto o urgencia del pedido' })
  @IsOptional()
  @IsString()
  urgency_context?: string;
} 