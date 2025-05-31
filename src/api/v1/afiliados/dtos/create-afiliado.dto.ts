import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength, IsUUID, IsDate, IsIn, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAfiliadoDto {
  @ApiProperty({
    description: 'Número de afiliado',
    example: 'AF123456'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  affiliateNumber: string;

  @ApiProperty({
    description: 'Estado del afiliado',
    example: 'ACTIVO'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  affiliateStatus: string;

  @ApiProperty({
    description: 'CUIL del afiliado',
    example: '20123456789'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cuil: string;

  @ApiPropertyOptional({
    description: 'CVU del afiliado',
    example: '0000000000000000000000'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  cvu?: string;

  @ApiPropertyOptional({
    description: 'Tipo de documento',
    example: 'DNI'
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  documentType?: string;

  @ApiProperty({
    description: 'Número de documento',
    example: '12345678'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber: string;

  @ApiPropertyOptional({
    description: 'País del documento',
    example: 'Argentina',
    default: 'Argentina'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentCountry?: string;

  @ApiPropertyOptional({
    description: 'Género',
    example: 'M',
    enum: ['M', 'F', 'O']
  })
  @IsString()
  @IsOptional()
  @IsIn(['M', 'F', 'O'])
  gender?: 'M' | 'F' | 'O';

  @ApiProperty({
    description: 'Nombre',
    example: 'Juan'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellido',
    example: 'Pérez'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento',
    example: '1990-01-01'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @ApiPropertyOptional({
    description: 'Nacionalidad',
    example: 'Argentina'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationality?: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'juan.perez@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'Contraseña',
    example: '********'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password: string;

  @ApiPropertyOptional({
    description: 'Ocupación',
    example: 'Ingeniero'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Teléfono',
    example: '+54911123456789'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto',
    example: 'https://example.com/photo.jpg'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  picture?: string;

  @ApiPropertyOptional({
    description: 'ID de la dirección principal',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  primaryAddressId?: string;

  @ApiPropertyOptional({
    description: 'IDs de las obras sociales asociadas',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d7-b789-123456789abc'],
    type: [String]
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  healthcareProviderIds?: string[];
} 