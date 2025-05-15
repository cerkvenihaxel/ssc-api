import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObrasSocialesController } from './obras-sociales.controller';
import { ObraSocialService } from '../../../application/services/obra-social/obra-social.service';
import { PostgresObraSocialRepository } from '../../../infrastructure/repositories/obra-social/obra-social.repository';
import { Pool } from 'pg';

@Module({
  imports: [ConfigModule],
  controllers: [ObrasSocialesController],
  providers: [
    ObraSocialService,
    {
      provide: 'IObraSocialRepository',
      useClass: PostgresObraSocialRepository,
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
  exports: [ObraSocialService],
})
export class ObrasSocialesModule {} 