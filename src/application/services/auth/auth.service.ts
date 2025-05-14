import { Injectable, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '../../../domain/repositories/user/user.repository';
import { IMagicLinkRepository } from '../../../domain/repositories/magiclink/magic-link.repository';
import { MagicLink } from '../../../domain/models/magiclink/magic-link.model';
import { User } from '../../../domain/models/user/user.model';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMagicLinkRepository')
    private readonly magicLinkRepository: IMagicLinkRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService
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
    const baseUrl = this.configService.get<string>('APP_URL');
    const loginUrl = `${baseUrl}/auth/verify?token=${magicLink.token}`;

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

  async verifyMagicLink(token: string, requestIp: string, userAgent: string): Promise<{ accessToken: string }> {
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

    // Generar JWT
    const payload = {
      sub: user.userId,
      email: user.email,
      roleId: user.roleId
    };

    return {
      accessToken: await this.jwtService.signAsync(payload)
    };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch {
      throw new UnauthorizedException();
    }
  }
} 