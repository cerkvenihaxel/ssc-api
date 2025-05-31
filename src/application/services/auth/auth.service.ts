import { Injectable, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '../../../domain/repositories/user/user.repository';
import { IMagicLinkRepository } from '../../../domain/repositories/magiclink/magic-link.repository';
import { IUserSessionRepository } from '../../../domain/repositories/session/user-session.repository';
import { MagicLink } from '../../../domain/models/magiclink/magic-link.model';
import { User } from '../../../domain/models/user/user.model';
import { UserSession } from '../../../domain/models/session/user-session.model';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { RouteService } from './route.service';
import { LoginSuccessDto, UserInfoDto } from '../../../api/v1/auth/dtos/user-info.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMagicLinkRepository')
    private readonly magicLinkRepository: IMagicLinkRepository,
    @Inject('IUserSessionRepository')
    private readonly sessionRepository: IUserSessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly routeService: RouteService
  ) {}

  async requestMagicLink(email: string, requestIp: string, userAgent: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`No se encontró ningún usuario registrado con el correo: ${email}`);
    }

    // Invalidar magic links activos anteriores
    const activeLinks = await this.magicLinkRepository.findActiveByUserId(user.userId);
    await Promise.all(
      activeLinks.map(link => 
        this.magicLinkRepository.update(new MagicLink(
          link.magicLinkId,
          link.userId,
          link.token,
          link.createdAt,
          link.expiresAt,
          new Date(),
          requestIp,
          userAgent,
          link.requestedIp,
          link.requestUserAgent,
          false
        ))
      )
    );

    // Crear nuevo magic link
    const magicLink = MagicLink.create(
      user.userId,
      requestIp,
      userAgent
    );
    await this.magicLinkRepository.save(magicLink);

    // Enviar email con el magic link
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const loginUrl = `${frontendUrl}/auth/verify?token=${magicLink.token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Link de acceso a SSC',
      template: 'magic-link',
      context: {
        nombre: user.nombre,
        loginUrl,
        expirationMinutes: 15,
        currentYear: new Date().getFullYear()
      }
    });
  }

  async verifyMagicLink(token: string, requestIp: string, userAgent: string): Promise<LoginSuccessDto> {
    const magicLink = await this.magicLinkRepository.findByToken(token);
    if (!magicLink) {
      throw new UnauthorizedException('Link inválido');
    }

    if (!magicLink.isValid()) {
      throw new UnauthorizedException('Link expirado o ya utilizado');
    }

    const user = await this.userRepository.findById(magicLink.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Marcar el magic link como usado
    await this.magicLinkRepository.update(
      magicLink.markAsUsed(requestIp, userAgent)
    );

    // Actualizar último login
    await this.userRepository.updateLastLogin(user.userId);

    // Crear sesión de usuario
    const deviceId = uuidv4();
    const session = UserSession.create(
      user.userId,
      deviceId,
      requestIp,
      userAgent
    );
    await this.sessionRepository.save(session);

    // Obtener permisos del usuario
    const permissions = await this.userRepository.getUserPermissions(user.userId);
    
    // Obtener información del rol
    const roleInfo = await this.userRepository.getUserRole(user.userId);
    
    // Obtener rutas disponibles
    const { defaultRoute, routes } = this.routeService.getRoutesByRole(roleInfo.name);

    // Preparar información del usuario
    const userInfo: UserInfoDto = {
      userId: user.userId,
      email: user.email,
      nombre: user.nombre,
      role: {
        id: roleInfo.id,
        name: roleInfo.name,
        description: roleInfo.description || ''
      },
      status: user.status,
      permissions: permissions,
      defaultRoute: defaultRoute,
      availableRoutes: routes,
      lastLogin: new Date(),
      emailVerified: user.emailVerified
    };

    // Generar JWT
    const payload = {
      sub: user.userId,
      email: user.email,
      roleId: user.roleId,
      roleName: roleInfo.name,
      sessionId: session.sessionId,
      permissions: permissions
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const expiresIn = 24 * 60 * 60; // 24 horas en segundos

    return {
      accessToken,
      sessionId: session.sessionId,
      user: userInfo,
      message: 'Inicio de sesión exitoso',
      expiresIn
    };
  }

  async getCurrentUser(userId: string): Promise<UserInfoDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const permissions = await this.userRepository.getUserPermissions(user.userId);
    const roleInfo = await this.userRepository.getUserRole(user.userId);
    const { defaultRoute, routes } = this.routeService.getRoutesByRole(roleInfo.name);

    return {
      userId: user.userId,
      email: user.email,
      nombre: user.nombre,
      role: {
        id: roleInfo.id,
        name: roleInfo.name,
        description: roleInfo.description || ''
      },
      status: user.status,
      permissions: permissions,
      defaultRoute: defaultRoute,
      availableRoutes: routes,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified
    };
  }

  async logout(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findBySessionId(sessionId);
    if (session) {
      await this.sessionRepository.update(session.markAsLoggedOut());
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }

      // Verificar si la sesión sigue activa
      const session = await this.sessionRepository.findBySessionId(payload.sessionId);
      if (!session || session.logoutAt) {
        throw new UnauthorizedException('Sesión finalizada');
      }

      return user;
    } catch {
      throw new UnauthorizedException();
    }
  }

  async refreshToken(userId: string, sessionId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const session = await this.sessionRepository.findBySessionId(sessionId);
    if (!session || session.logoutAt) {
      throw new UnauthorizedException('Sesión no válida');
    }

    const permissions = await this.userRepository.getUserPermissions(user.userId);
    const roleInfo = await this.userRepository.getUserRole(user.userId);

    const payload = {
      sub: user.userId,
      email: user.email,
      roleId: user.roleId,
      roleName: roleInfo.name,
      sessionId: session.sessionId,
      permissions: permissions
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const expiresIn = 24 * 60 * 60; // 24 horas en segundos

    return {
      accessToken,
      expiresIn
    };
  }
} 