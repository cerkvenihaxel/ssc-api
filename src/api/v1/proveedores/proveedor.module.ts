import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedorController } from './proveedor.controller';
import { ProveedorService } from '../../../application/services/proveedor/proveedor.service';
import { PostgresProveedorRepository } from '../../../infrastructure/persistence/postgres/repositories/proveedor.repository';
import { ProveedorEntity } from '../../../infrastructure/persistence/postgres/entities/proveedor.entity';
import { PROVEEDOR_REPOSITORY } from '../../../domain/repositories/proveedor/proveedor.repository.token';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProveedorEntity]),
    AuthModule
  ],
  controllers: [ProveedorController],
  providers: [
    ProveedorService,
    {
      provide: PROVEEDOR_REPOSITORY,
      useClass: PostgresProveedorRepository,
    },
  ],
  exports: [ProveedorService],
})
export class ProveedorModule {} 