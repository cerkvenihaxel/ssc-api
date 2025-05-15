import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './controllers/Health/health.controller';
import { AfiliadosModule } from './v1/afiliados/afiliados.module';
import { AddressModule } from './v1/address/address.module';
import { ObrasSocialesModule } from './v1/obras-sociales/obras-sociales.module';
import { ProveedorModule } from './v1/proveedores/proveedor.module';
import { typeOrmConfig } from '../infrastructure/config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AfiliadosModule,
    AddressModule,
    ObrasSocialesModule,
    ProveedorModule
  ],
  controllers: [HealthController],
})
export class ApiModule {}
