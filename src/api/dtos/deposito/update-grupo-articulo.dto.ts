import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGrupoArticuloDto {
  @ApiPropertyOptional({
    description: 'Nombre del grupo de artículos',
    example: 'Medicamentos',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción del grupo de artículos',
    example: 'Grupo que contiene todos los medicamentos del depósito'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
} 