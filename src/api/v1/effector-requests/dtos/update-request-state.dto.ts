import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class UpdateRequestStateDto {
  @ApiProperty({ 
    enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'EN_COTIZACION', 'COTIZADO', 'ADJUDICADO'],
    description: 'Nuevo estado del pedido'
  })
  @IsNotEmpty()
  @IsEnum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'EN_COTIZACION', 'COTIZADO', 'ADJUDICADO'])
  state_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observations?: string;
} 