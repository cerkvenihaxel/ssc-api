import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestMagicLinkDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
} 