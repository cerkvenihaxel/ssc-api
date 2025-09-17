import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../application/services/auth/auth.service';
import { RouteService } from '../../../application/services/auth/route.service';
import { PostgresUserRepository } from '../../../infrastructure/repositories/user/user.repository';
import { PostgresMagicLinkRepository } from '../../../infrastructure/repositories/magiclink/magic-link.repository';
import { PostgresUserSessionRepository } from '../../../infrastructure/repositories/session/user-session.repository';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { Pool } from 'pg';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const port = Number(config.get('MAIL_PORT')) || 587;
        const encryption = (config.get<string>('MAIL_ENCRYPTION') || 'tls').toLowerCase();
        const secure = encryption === 'ssl' || port === 465; // true solo si 465/SSL

        return {
          transport: {
            host: config.get('MAIL_HOST'), // p.ej. smtp.gmail.com
            port: port,
            secure: secure, // 587->false (STARTTLS), 465->true (TLS directo)
            auth: {
              user: config.get('MAIL_USERNAME'),
              pass: config.get('MAIL_PASSWORD'),
            },
            family: 4, // fuerza IPv4 (evita resolución IPv6)
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            tls: {
              rejectUnauthorized: true, // dejalo true en prod
            },
          },
          defaults: {
            from: `${config.get('MAIL_FROM_NAME')} <${config.get('MAIL_FROM_ADDRESS')}>`,
          },
          template: {
            dir: process.cwd() + '/templates',
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RouteService,
    JwtStrategy,
    {
      provide: 'IUserRepository',
      useClass: PostgresUserRepository,
    },
    {
      provide: 'IMagicLinkRepository',
      useClass: PostgresMagicLinkRepository,
    },
    {
      provide: 'IUserSessionRepository',
      useClass: PostgresUserSessionRepository,
    },
    {
      provide: Pool,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          database: configService.get('DB_NAME'),
          user: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, RouteService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {} 