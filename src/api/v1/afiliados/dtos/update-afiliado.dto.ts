import { IsOptional, IsString, IsEmail, MaxLength, IsUUID, IsDate, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAfiliadoDto {
  @ApiPropertyOptional({
    description: 'Número de afiliado',
    example: 'AF123456'
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  affiliateNumber?: string;

  @ApiPropertyOptional({
    description: 'Estado del afiliado',
    example: 'ACTIVO'
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  affiliateStatus?: string;

  @ApiPropertyOptional({
    description: 'CUIL del afiliado',
    example: '20123456789'
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cuil?: string;

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

  @ApiPropertyOptional({
    description: 'Número de documento',
    example: '12345678'
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'País del documento',
    example: 'Argentina'
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

  @ApiPropertyOptional({
    description: 'Nombre',
    example: 'Juan'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido',
    example: 'Pérez'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

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

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan.perez@example.com'
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    description: 'Contraseña',
    example: '********'
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  password?: string;

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
    description: 'ID del usuario asociado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
} 