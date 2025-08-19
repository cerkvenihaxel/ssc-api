import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditCriteriaDto } from './audit-criteria.dto';

export class UpdateAuditRequestDto {
  @ApiProperty({ 
    description: 'Estado de la auditoría',
    enum: ['pending', 'in_progress', 'approved', 'rejected', 'completed']
  })
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'approved', 'rejected', 'completed'])
  audit_status?: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';

  @ApiProperty({ description: 'Notas del auditor', required: false })
  @IsOptional()
  @IsString()
  auditor_notes?: string;

  @ApiProperty({ description: 'Razón del rechazo', required: false })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiProperty({ description: 'Costo aprobado', required: false })
  @IsOptional()
  @IsNumber()
  approved_cost?: number;

  @ApiProperty({ description: 'Comparación de items', required: false })
  @IsOptional()
  item_comparison?: any;

  @ApiProperty({ 
    description: 'Criterios de auditoría', 
    required: false,
    type: AuditCriteriaDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuditCriteriaDto)
  audit_criteria?: AuditCriteriaDto;
} 