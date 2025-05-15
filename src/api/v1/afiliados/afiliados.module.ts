import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AfiliadosController } from './afiliados.controller';
import { AfiliadoService } from '../../../application/services/afiliado/afiliado.service';
import { PostgresAfiliadoRepository } from '../../../infrastructure/repositories/afiliado/afiliado.repository';
import { Pool } from 'pg';

@Module({
  imports: [ConfigModule],
  controllers: [AfiliadosController],
  providers: [
    AfiliadoService,
    {
      provide: 'IAfiliadoRepository',
      useClass: PostgresAfiliadoRepository,
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
  exports: [AfiliadoService],
})
export class AfiliadosModule {} 