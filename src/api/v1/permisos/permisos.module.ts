import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermisosController } from './permisos.controller';
import { PermisoService } from '../../../application/services/permiso/permiso.service';
import { PostgresPermisoRepository } from '../../../infrastructure/repositories/permiso/permiso.repository';
import { Pool } from 'pg';

@Module({
  imports: [ConfigModule],
  controllers: [PermisosController],
  providers: [
    PermisoService,
    {
      provide: 'IPermisoRepository',
      useClass: PostgresPermisoRepository,
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
  exports: [PermisoService],
})
export class PermisosModule {} 