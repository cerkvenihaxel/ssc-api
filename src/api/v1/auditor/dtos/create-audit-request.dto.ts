import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateAuditRequestDto {
  @ApiProperty({ description: 'ID de la cotización a auditar' })
  @IsUUID()
  quotation_id: string;

  @ApiProperty({ description: 'ID del pedido médico' })
  @IsUUID()
  medical_order_id: string;

  @ApiProperty({ description: 'ID del proveedor' })
  @IsUUID()
  provider_id: string;

  @ApiProperty({ description: 'Notas del auditor', required: false })
  @IsOptional()
  @IsString()
  auditor_notes?: string;

  @ApiProperty({ description: 'Costo original del pedido', required: false })
  @IsOptional()
  @IsNumber()
  original_order_cost?: number;

  @ApiProperty({ description: 'Costo cotizado', required: false })
  @IsOptional()
  @IsNumber()
  quoted_cost?: number;

  @ApiProperty({ description: 'Costo aprobado', required: false })
  @IsOptional()
  @IsNumber()
  approved_cost?: number;

  @ApiProperty({ description: 'Comparación de items', required: false })
  @IsOptional()
  item_comparison?: any;

  @ApiProperty({ description: 'Criterios de auditoría', required: false })
  @IsOptional()
  audit_criteria?: any;

  @ApiProperty({ 
    description: 'Tipo de auditoría', 
    enum: ['manual', 'ai', 'hybrid'],
    default: 'manual'
  })
  @IsOptional()
  @IsEnum(['manual', 'ai', 'hybrid'])
  audit_type?: 'manual' | 'ai' | 'hybrid' = 'manual';
} 