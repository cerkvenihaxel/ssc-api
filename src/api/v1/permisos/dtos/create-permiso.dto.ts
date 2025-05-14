import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermisoDto {
  @ApiProperty({
    description: 'Nombre del permiso',
    example: 'CREAR_USUARIO'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del permiso',
    example: 'Permite crear nuevos usuarios en el sistema'
  })
  @IsString()
  descripcion?: string;
} 