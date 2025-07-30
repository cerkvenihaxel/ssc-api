import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllArticulosQueryDto {
  @ApiPropertyOptional({ description: 'ID del proveedor' })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({ description: 'ID del grupo' })
  @IsOptional()
  @IsUUID()
  grupoId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por artículos en stock' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Precio mínimo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Precio máximo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Término de búsqueda' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Límite de resultados' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset para paginación' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
