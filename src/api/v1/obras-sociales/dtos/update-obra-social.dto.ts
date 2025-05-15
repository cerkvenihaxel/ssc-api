import { IsOptional, IsString, IsEmail, MaxLength, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateObraSocialDto {
  @ApiPropertyOptional({
    description: 'Nombre de la obra social',
    example: 'OSDE'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Estado de la obra social',
    example: 'ACTIVA'
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  status?: string;

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
    example: 'contacto@osde.com.ar'
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Dirección',
    example: 'Av. Corrientes 1234, CABA'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que actualiza el registro',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  updatedBy?: string;
} 