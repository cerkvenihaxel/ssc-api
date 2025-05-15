import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './controllers/Health/health.controller';
import { AuthModule } from './v1/auth/auth.module';
import { PermisosModule } from './v1/permisos/permisos.module';
import { AfiliadosModule } from './v1/afiliados/afiliados.module';
import { AddressModule } from './v1/address/address.module';
import { typeOrmConfig } from '../infrastructure/config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    PermisosModule,
    AfiliadosModule,
    AddressModule
  ],
  controllers: [HealthController],
})
export class ApiModule {}
