import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEspecialidadDto {
  @ApiPropertyOptional({
    description: 'Nombre de la especialidad',
    example: 'Cardiología'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la especialidad',
    example: 'Especialidad médica que se ocupa del estudio del corazón'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Código de la especialidad',
    example: 'CARD'
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Estado activo de la especialidad',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;
} 