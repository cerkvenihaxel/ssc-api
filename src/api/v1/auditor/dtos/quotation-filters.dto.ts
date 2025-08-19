import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QuotationFiltersDto {
  @ApiProperty({ 
    description: 'Filtrar por estado de cotización',
    required: false,
    enum: ['pending', 'sent', 'approved', 'rejected', 'completed']
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ 
    description: 'Filtrar por proveedor',
    required: false 
  })
  @IsOptional()
  @IsString()
  provider_id?: string;

  @ApiProperty({ 
    description: 'Fecha desde (YYYY-MM-DD)',
    required: false,
    example: '2025-01-01'
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({ 
    description: 'Fecha hasta (YYYY-MM-DD)',
    required: false,
    example: '2025-12-31'
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiProperty({ 
    description: 'Filtrar por nombre de paciente',
    required: false 
  })
  @IsOptional()
  @IsString()
  patient_name?: string;

  @ApiProperty({ 
    description: 'Filtrar por orden médica',
    required: false 
  })
  @IsOptional()
  @IsString()
  medical_order_id?: string;

  @ApiProperty({ 
    description: 'Número de página',
    required: false,
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ 
    description: 'Elementos por página',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
} 