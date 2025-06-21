import { Controller, Post, Body, Ip, Headers, UnauthorizedException, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../../application/services/auth/auth.service';
import { RequestMagicLinkDto } from './dtos/magiclink/request-magic-link.dto';
import { VerifyMagicLinkDto } from './dtos/magiclink/verify-magic-link.dto';
import { LoginSuccessDto, UserInfoDto } from './dtos/user-info.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '../../../domain/repositories/user/user.repository';
import { RouteService } from '../../../application/services/auth/route.service';
import { Inject } from '@nestjs/common';

@ApiTags('Autenticación')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly routeService: RouteService
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
    const result = await this.authService.sendMagicLink(dto.email, { ip, userAgent });
    return result;
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
    @Request() req: any
  ): Promise<LoginSuccessDto> {
    return this.authService.verifyMagicLink(dto.token, req);
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
    const user = await this.userRepository.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const permissions = await this.userRepository.getUserPermissions(user.userId);
    const userRole = await this.userRepository.getUserRole(user.userId);
    const routeData = this.routeService.getRoutesByRole(userRole.name);

    return {
      userId: user.userId,
      email: user.email,
      nombre: user.nombre,
      role: {
        id: userRole.id,
        name: userRole.name,
        description: userRole.description,
      },
      status: user.status,
      permissions,
      defaultRoute: routeData.defaultRoute,
      availableRoutes: routeData.routes,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
    };
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
    const user = await this.userRepository.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const permissions = await this.userRepository.getUserPermissions(user.userId);
    const userRole = await this.userRepository.getUserRole(user.userId);

    const payload = {
      sub: user.userId,
      email: user.email,
      roleId: user.roleId,
      sessionId: req.user.sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
    });

    return {
      accessToken,
      expiresIn: 24 * 60 * 60, // 24 horas en segundos
    };
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