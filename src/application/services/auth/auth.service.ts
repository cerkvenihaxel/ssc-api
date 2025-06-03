import { Injectable, UnauthorizedException, NotFoundException, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '../../../domain/repositories/user/user.repository';
import { IMagicLinkRepository } from '../../../domain/repositories/magiclink/magic-link.repository';
import { IUserSessionRepository } from '../../../domain/repositories/session/user-session.repository';
import { MagicLink } from '../../../domain/models/magiclink/magic-link.model';
import { User } from '../../../domain/models/user/user.model';
import { UserSession, ClientInfo } from '../../../domain/models/session/user-session.model';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { RouteService } from './route.service';
import { FingerprintUtil } from '../../../shared/utils/fingerprint.util';
import { LoginSuccessDto, UserInfoDto } from '../../../api/v1/auth/dtos/user-info.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    private readonly routeService: RouteService,
  ) {
    // Limpiar sesiones expiradas cada hora
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  async sendMagicLink(email: string, clientInfo?: any): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Revocar magic links previos para este usuario - implementar invalidación manual
      const activeLinks = await this.magicLinkRepository.findActiveByUserId(user.userId);
      for (const link of activeLinks) {
        await this.magicLinkRepository.update(
          new MagicLink(
            link.magicLinkId,
            link.userId,
            link.token,
            link.createdAt,
            link.expiresAt,
            new Date(), // usedAt
            '', // usedIp
            '', // userAgent
            link.requestedIp,
            link.requestUserAgent,
            false // isActive
          )
        );
      }

      const magicLink = MagicLink.create(
        user.userId,
        '', // requestedIp - se actualizará cuando venga del controlador
        '', // requestUserAgent
        15 // 15 minutos de validez
      );

      await this.magicLinkRepository.save(magicLink);

      const magicLinkUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify?token=${magicLink.token}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Acceso al Sistema - SSC',
        template: 'magic-link',
        context: {
          nombre: user.nombre,
          loginUrl: magicLinkUrl,
          expirationMinutes: 15,
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(`Magic link enviado a ${email}`);

      return {
        message: 'Link de acceso enviado correctamente',
      };
    } catch (error) {
      this.logger.error('Error enviando magic link:', error);
      throw error;
    }
  }

  async verifyMagicLink(
    token: string, 
    request: any
  ): Promise<LoginSuccessDto> {
    try {
      const magicLink = await this.magicLinkRepository.findByToken(token);
      if (!magicLink) {
        throw new UnauthorizedException('Token inválido');
      }

      if (magicLink.isExpired()) {
        throw new UnauthorizedException('Token expirado');
      }

      if (magicLink.isUsed()) {
        throw new UnauthorizedException('Token ya utilizado');
      }

      const user = await this.userRepository.findById(magicLink.userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Generar información del cliente y fingerprint
      const userAgent = request.headers['user-agent'] || '';
      const ipAddress = this.getClientIpAddress(request);
      const parsedClientInfo = FingerprintUtil.parseUserAgent(userAgent);
      
      // Combinar con información adicional del cliente si está disponible
      const clientInfo: ClientInfo = {
        ...parsedClientInfo,
        language: request.headers['accept-language']?.split(',')[0],
        timezone: request.body?.timezone || undefined,
        screenResolution: request.body?.screenResolution || undefined,
      };

      const fingerprint = FingerprintUtil.generateFingerprint(userAgent, ipAddress, clientInfo);
      const deviceId = FingerprintUtil.generateDeviceId(fingerprint, user.userId);

      // Revocar sesiones anteriores para este dispositivo
      await this.sessionRepository.revokeActiveSessionsForDevice(deviceId);

      // Crear nueva sesión
      const session = UserSession.create(
        user.userId,
        deviceId,
        ipAddress,
        userAgent,
        {
          fingerprint,
          clientInfo,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        }
      );

      await this.sessionRepository.save(session);

      // Marcar magic link como usado
      await this.magicLinkRepository.update(
        magicLink.markAsUsed('', '') // ipAddress y userAgent se pasarán vacíos por ahora
      );

      // Actualizar último login del usuario
      await this.userRepository.updateLastLogin(user.userId);

      // Obtener información completa del usuario
      const userRole = await this.userRepository.getUserRole(user.userId);
      const permissions = await this.userRepository.getUserPermissions(user.userId);
      const routeData = this.routeService.getRoutesByRole(userRole.name);

      // Crear JWT token
      const payload = {
        sub: user.userId,
        email: user.email,
        roleId: user.roleId,
        sessionId: session.sessionId,
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '24h',
      });

      const userInfo: UserInfoDto = {
        userId: user.userId,
        email: user.email,
        nombre: user.nombre,
        role: {
          id: userRole.id,
          name: userRole.name,
          description: userRole.description,
        },
        status: user.status as 'active' | 'inactive' | 'pending',
        permissions,
        defaultRoute: routeData.defaultRoute,
        availableRoutes: routeData.routes,
        emailVerified: user.emailVerified,
      };

      this.logger.log(`Usuario ${user.email} autenticado exitosamente. Sesión: ${session.sessionId}`);

      return {
        accessToken,
        sessionId: session.sessionId,
        user: userInfo,
        message: 'Autenticado exitosamente',
        expiresIn: 24 * 60 * 60, // 24 horas en segundos
      };
    } catch (error) {
      this.logger.error('Error verificando magic link:', error);
      throw error;
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      const session = await this.sessionRepository.findBySessionId(sessionId);
      if (session && session.isValid()) {
        await this.sessionRepository.update(session.markAsLoggedOut());
        this.logger.log(`Sesión ${sessionId} cerrada exitosamente`);
      }
    } catch (error) {
      this.logger.error('Error cerrando sesión:', error);
      throw error;
    }
  }

  async validateToken(token: string, request?: any): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Verificar si la sesión sigue activa y válida
      const session = await this.sessionRepository.findBySessionId(payload.sessionId);
      if (!session || !session.isValid()) {
        throw new UnauthorizedException('Sesión inválida o expirada');
      }

      // Validar fingerprint si está disponible la información del request
      if (request && session.fingerprint) {
        const currentUserAgent = request.headers['user-agent'] || '';
        const currentIpAddress = this.getClientIpAddress(request);
        const currentClientInfo = FingerprintUtil.parseUserAgent(currentUserAgent);
        const currentFingerprint = FingerprintUtil.generateFingerprint(
          currentUserAgent, 
          currentIpAddress, 
          currentClientInfo
        );

        if (!FingerprintUtil.validateFingerprint(currentFingerprint, session.fingerprint)) {
          this.logger.warn(`Fingerprint mismatch para sesión ${session.sessionId}`);
          // Revocar sesión por seguridad
          await this.sessionRepository.update(session.markAsInactive());
          throw new UnauthorizedException('Sesión comprometida');
        }
      }

      // Actualizar actividad de la sesión
      await this.sessionRepository.updateActivity(session.sessionId);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error validando token:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }

  async revokeAllUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    try {
      await this.sessionRepository.revokeActiveSessionsForUser(userId, excludeSessionId);
      this.logger.log(`Todas las sesiones del usuario ${userId} han sido revocadas`);
    } catch (error) {
      this.logger.error('Error revocando sesiones:', error);
      throw error;
    }
  }

  async getActiveSessions(userId: string): Promise<UserSession[]> {
    try {
      return await this.sessionRepository.findActiveByUserId(userId);
    } catch (error) {
      this.logger.error('Error obteniendo sesiones activas:', error);
      return [];
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const markedCount = await this.sessionRepository.markExpiredSessionsAsInactive();
      if (markedCount > 0) {
        this.logger.log(`${markedCount} sesiones expiradas marcadas como inactivas`);
      }

      // Limpiar sesiones muy antiguas (más de 30 días)
      const deletedCount = await this.sessionRepository.cleanupOldSessions(30);
      if (deletedCount > 0) {
        this.logger.log(`${deletedCount} sesiones antiguas eliminadas`);
      }
    } catch (error) {
      this.logger.error('Error en limpieza de sesiones:', error);
    }
  }

  private getClientIpAddress(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }
} 