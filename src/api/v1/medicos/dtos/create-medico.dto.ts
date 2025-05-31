import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicoDto {
  @ApiProperty({
    description: 'Matrícula del médico',
    example: 'MN12345'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  matricula: string;

  @ApiProperty({
    description: 'ID de la especialidad médica',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  especialidadId: string;

  @ApiProperty({
    description: 'Nombre del médico',
    example: 'Juan'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del médico',
    example: 'Pérez'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Email del médico',
    example: 'juan.perez@hospital.com'
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

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
    description: 'IDs de obras sociales asociadas',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000']
  })
  @IsOptional()
  @IsUUID(4, { each: true })
  obrasSociales?: string[];

  @ApiPropertyOptional({
    description: 'ID del usuario que crea el registro',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  createdBy?: string;
} 