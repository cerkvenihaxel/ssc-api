import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({
    description: 'Nombre del proveedor',
    example: 'Proveedor XYZ'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerName: string;

  @ApiProperty({
    description: 'Tipo de proveedor',
    example: 'SERVICIOS'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  providerType: string;

  @ApiProperty({
    description: 'CUIT del proveedor',
    example: '30123456789'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cuit: string;

  @ApiPropertyOptional({
    description: 'Nombre del contacto',
    example: 'Juan Pérez'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+54911123456789'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'contacto@proveedorxyz.com'
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @ApiProperty({
    description: 'Estado del proveedor',
    example: 'ACTIVO'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  status: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que crea el registro',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario asociado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'IDs de las especialidades del proveedor',
    example: ['87fbb9f7-2c8b-4179-ab2c-29cccd676b15', 'bbe1348e-bc64-4118-b0f8-b92e55820004'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];
} 