import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, ValidateNested, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class AuditedItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  quotation_item_id: string;

  @ApiProperty({ enum: ['approved', 'rejected', 'partial'] })
  @IsEnum(['approved', 'rejected', 'partial'])
  decision: 'approved' | 'rejected' | 'partial';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  approved_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  approved_unit_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  audit_notes?: string;
}

export class AuditQuotationDto {
  @ApiProperty({ 
    enum: ['approved', 'rejected', 'partial', 'requires_review'],
    description: 'Decisión general de la auditoría'
  })
  @IsEnum(['approved', 'rejected', 'partial', 'requires_review'])
  @IsNotEmpty()
  decision: 'approved' | 'rejected' | 'partial' | 'requires_review';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  audit_notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiProperty({ 
    type: [AuditedItemDto], 
    required: false,
    description: 'Decisiones específicas por item (requerido para auditoría parcial)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditedItemDto)
  item_decisions?: AuditedItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  approved_total_amount?: number;

  @ApiProperty({ 
    required: false,
    description: 'Recomendaciones del auditor'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];

  @ApiProperty({ 
    required: false,
    description: 'Factores de riesgo identificados'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  risk_factors?: string[];

  @ApiProperty({ 
    required: false,
    enum: ['low', 'medium', 'high', 'critical'],
    description: 'Nivel de riesgo general'
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  risk_level?: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ 
    required: false,
    description: 'Requiere seguimiento adicional'
  })
  @IsOptional()
  requires_follow_up?: boolean;
} 