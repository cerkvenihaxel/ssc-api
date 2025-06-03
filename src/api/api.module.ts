import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './controllers/Health/health.controller';
import { AfiliadosModule } from './v1/afiliados/afiliados.module';
import { AddressModule } from './v1/address/address.module';
import { ObrasSocialesModule } from './v1/obras-sociales/obras-sociales.module';
import { EspecialidadesModule } from './v1/especialidades/especialidades.module';
import { MedicosModule } from './v1/medicos/medicos.module';
import { ProveedorModule } from './v1/proveedores/proveedor.module';
import { AuthModule } from './v1/auth/auth.module';
import { AdminUserModule } from './v1/admin/admin-user.module';
import { AdminEspecialidadesModule } from './v1/admin/admin-especialidades.module';
import { DepositoModule } from './v1/deposito/deposito.module';
import { typeOrmConfig } from '../infrastructure/config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    AdminUserModule,
    AdminEspecialidadesModule,
    AfiliadosModule,
    AddressModule,
    ObrasSocialesModule,
    EspecialidadesModule,
    MedicosModule,
    ProveedorModule,
    DepositoModule
  ],
  controllers: [HealthController],
})
export class ApiModule {}
