import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGrupoArticuloDto {
  @ApiProperty({
    description: 'Nombre del grupo de artículos',
    example: 'Medicamentos',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del grupo de artículos',
    example: 'Grupo que contiene todos los medicamentos del depósito'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
} 