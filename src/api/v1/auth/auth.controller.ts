import { Controller, Post, Body, Ip, Headers, UnauthorizedException, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../../application/services/auth/auth.service';
import { RequestMagicLinkDto } from './dtos/magiclink/request-magic-link.dto';
import { VerifyMagicLinkDto } from './dtos/magiclink/verify-magic-link.dto';
import { LoginSuccessDto, UserInfoDto } from './dtos/user-info.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Autenticación')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

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

  @ApiOperation({ summary: 'Verificar un magic link y obtener token JWT con información del usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso con información completa del usuario',
    type: LoginSuccessDto
  })
  @ApiResponse({ status: 401, description: 'Link inválido o expirado' })
  @Get('verify')
  async verifyMagicLink(
    @Query() dto: VerifyMagicLinkDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<LoginSuccessDto> {
    return this.authService.verifyMagicLink(dto.token, ip, userAgent);
  }

  @ApiOperation({ summary: 'Obtener información del usuario actual' })
  @ApiResponse({ 
    status: 200, 
    description: 'Información del usuario recuperada exitosamente',
    type: UserInfoDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req: any): Promise<UserInfoDto> {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refrescado exitosamente',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        expiresIn: {
          type: 'number',
          example: 86400
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Sesión no válida' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Request() req: any): Promise<{ accessToken: string; expiresIn: number }> {
    return this.authService.refreshToken(req.user.userId, req.user.sessionId);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any): Promise<{ message: string }> {
    await this.authService.logout(req.user.sessionId);
    return { message: 'Sesión cerrada exitosamente' };
  }

  @ApiOperation({ summary: 'Verificar si el token es válido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token válido',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          example: true
        },
        user: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            roleId: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@Request() req: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: {
        userId: req.user.userId,
        email: req.user.email,
        roleId: req.user.roleId
      }
    };
  }
} 