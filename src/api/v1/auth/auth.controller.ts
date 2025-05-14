import { Controller, Post, Body, Ip, Headers, UnauthorizedException, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AuthService } from '../../../application/services/auth/auth.service';
import { RequestMagicLinkDto } from './dtos/magiclink/request-magic-link.dto';
import { VerifyMagicLinkDto } from './dtos/magiclink/verify-magic-link.dto';

@ApiTags('Autenticación')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Solicitar un magic link de acceso' })
  @ApiResponse({ 
    status: 200, 
    description: 'Magic link enviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Se ha enviado un enlace de acceso a tu correo electrónico'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Post('login')
  async requestMagicLink(
    @Body() dto: RequestMagicLinkDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<{ message: string }> {
    await this.authService.requestMagicLink(dto.email, ip, userAgent);
    return { message: 'Se ha enviado un enlace de acceso a tu correo electrónico' };
  }

  @ApiOperation({ summary: 'Verificar un magic link y obtener token JWT' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token JWT generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Link inválido o expirado' })
  @Get('verify')
  async verifyMagicLink(
    @Query() dto: VerifyMagicLinkDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.authService.verifyMagicLink(dto.token, ip, userAgent);
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT',
    required: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión cerrada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Sesión cerrada exitosamente'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  @Post('logout')
  async logout(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new UnauthorizedException('No hay token de acceso');
    }
    const token = auth.split(' ')[1];
    await this.authService.validateToken(token);
    return { message: 'Sesión cerrada exitosamente' };
  }
} 