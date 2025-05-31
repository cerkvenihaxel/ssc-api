import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MedicosController } from './medicos.controller';
import { MedicoService } from '../../../application/services/medico/medico.service';
import { PostgresMedicoRepository } from '../../../infrastructure/repositories/medico/medico.repository';
import { Pool } from 'pg';

@Module({
  imports: [ConfigModule],
  controllers: [MedicosController],
  providers: [
    MedicoService,
    {
      provide: 'IMedicoRepository',
      useClass: PostgresMedicoRepository,
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
  exports: [MedicoService],
})
export class MedicosModule {} 