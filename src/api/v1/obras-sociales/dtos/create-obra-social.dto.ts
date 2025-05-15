import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObraSocialDto {
  @ApiProperty({
    description: 'Nombre de la obra social',
    example: 'OSDE'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Estado de la obra social',
    example: 'ACTIVA'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  status: string;

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
    description: 'ID del usuario que crea el registro',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  createdBy?: string;
} 