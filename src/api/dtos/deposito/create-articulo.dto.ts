import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, IsArray, IsPositive, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateArticuloDto {
  @ApiProperty({
    description: 'ID del proveedor',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({
    description: 'Código del artículo',
    example: 'MED001',
    maxLength: 20
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({
    description: 'Nombre del artículo',
    example: 'Paracetamol 500mg',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del artículo',
    example: 'Analgésico y antipirético para dolores leves y moderados'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Presentación del artículo',
    example: 'Caja x 20 comprimidos',
    maxLength: 255
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  presentacion?: string;

  @ApiProperty({
    description: 'Precio del artículo',
    example: 1250.50,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  precio: number;

  @ApiPropertyOptional({
    description: 'Stock disponible',
    example: 100,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({
    description: 'IDs de los grupos asociados',
    example: ['87fbb9f7-2c8b-4179-ab2c-29cccd676b15'],
    type: [String]
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  grupos?: string[];

  // Campos para artículo detalle (opcional)
  @ApiPropertyOptional({
    description: 'ID de la marca',
    example: 1
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  idMarca?: number;

  @ApiPropertyOptional({
    description: 'Precio de compra con IVA',
    example: 1000.00,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  precioComSiva?: number;

  @ApiPropertyOptional({
    description: 'Precio de venta con IVA',
    example: 1250.50,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  precioVtaSiva?: number;
} 