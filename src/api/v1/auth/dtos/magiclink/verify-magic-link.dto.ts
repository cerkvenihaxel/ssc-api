import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMagicLinkDto {
  @ApiProperty({
    description: 'Token del magic link enviado por correo',
    example: 'a1b2c3d4e5f6...'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
} 