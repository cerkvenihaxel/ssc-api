import { IsOptional, IsString, IsEmail, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMedicoDto {
  @ApiPropertyOptional({
    description: 'Matrícula del médico',
    example: 'MN12345'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  matricula?: string;

  @ApiPropertyOptional({
    description: 'ID de la especialidad médica',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  especialidadId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del médico',
    example: 'Juan'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del médico',
    example: 'Pérez'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email del médico',
    example: 'juan.perez@hospital.com'
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del médico',
    example: '+54911234567'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto del médico',
    example: 'https://example.com/photo.jpg'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  picture?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que actualiza el registro',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  updatedBy?: string;
} 