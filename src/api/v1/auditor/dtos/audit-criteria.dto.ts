import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AuditCriteriaDto {
  @ApiProperty({
    description: 'El precio es razonable',
    example: true
  })
  @IsBoolean()
  price_reasonable: boolean;

  @ApiProperty({
    description: 'La calidad es adecuada',
    example: true
  })
  @IsBoolean()
  quality_adequate: boolean;

  @ApiProperty({
    description: 'El tiempo de entrega es aceptable',
    example: true
  })
  @IsBoolean()
  delivery_time_acceptable: boolean;

  @ApiProperty({
    description: 'El proveedor es confiable',
    example: true
  })
  @IsBoolean()
  provider_reliable: boolean;

  @ApiProperty({
    description: 'La documentación está completa',
    example: true
  })
  @IsBoolean()
  documentation_complete: boolean;
} 