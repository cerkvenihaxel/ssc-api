import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePermisoDto {
  @ApiPropertyOptional({
    description: 'Nombre del permiso',
    example: 'CREAR_USUARIO'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción del permiso',
    example: 'Permite crear nuevos usuarios en el sistema'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
} 