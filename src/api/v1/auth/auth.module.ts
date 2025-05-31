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
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: false, // true para 465, false para otros puertos
          auth: {
            user: configService.get('MAIL_USERNAME'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${configService.get('MAIL_FROM_NAME')}" <${configService.get('MAIL_FROM_ADDRESS')}>`,
        },
        template: {
          dir: process.cwd() + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
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