import { IsNotEmpty, IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEspecialidadDto {
  @ApiProperty({
    description: 'Nombre de la especialidad',
    example: 'Cardiología'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

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
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;
} 