import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from '../../../application/services/admin/admin-user.service';
import { Usuario } from '../../../infrastructure/persistence/postgres/entities/usuario.entity';
import { ProveedorEntity } from '../../../infrastructure/persistence/postgres/entities/proveedor.entity';
import { AuthModule } from '../auth/auth.module';
import { PostgresUserRepository } from '../../../infrastructure/repositories/user/user.repository';
import { Pool } from 'pg';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Usuario, ProveedorEntity]),
    AuthModule
  ],
  controllers: [AdminUserController],
  providers: [
    AdminUserService,
    {
      provide: 'IUserRepository',
      useClass: PostgresUserRepository,
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
  exports: [AdminUserService]
})
export class AdminUserModule {} 