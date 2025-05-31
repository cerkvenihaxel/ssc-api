import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EspecialidadesController } from './especialidades.controller';
import { EspecialidadService } from '../../../application/services/especialidad/especialidad.service';
import { PostgresEspecialidadRepository } from '../../../infrastructure/repositories/especialidad/especialidad.repository';
import { Pool } from 'pg';

@Module({
  imports: [ConfigModule],
  controllers: [EspecialidadesController],
  providers: [
    EspecialidadService,
    {
      provide: 'IEspecialidadRepository',
      useClass: PostgresEspecialidadRepository,
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
  exports: [EspecialidadService],
})
export class EspecialidadesModule {} 