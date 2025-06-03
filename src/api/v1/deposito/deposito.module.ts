import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades
import { ArticuloEntity } from '../../../infrastructure/persistence/postgres/entities/articulo.entity';
import { ArticuloDetalleEntity } from '../../../infrastructure/persistence/postgres/entities/articulo-detalle.entity';
import { GrupoArticuloEntity } from '../../../infrastructure/persistence/postgres/entities/grupo-articulo.entity';

// Repositorios
import { PostgresArticuloRepository } from '../../../infrastructure/persistence/postgres/repositories/articulo.repository';
import { PostgresGrupoArticuloRepository } from '../../../infrastructure/persistence/postgres/repositories/grupo-articulo.repository';

// Servicios
import { ArticuloService } from '../../../application/services/deposito/articulo.service';
import { GrupoArticuloService, GRUPO_ARTICULO_REPOSITORY_TOKEN } from '../../../application/services/deposito/grupo-articulo.service';

// Controladores
import { ArticulosController } from './articulos.controller';
import { GruposController } from './grupos.controller';

// Token para inyección de dependencias
export const ARTICULO_REPOSITORY_TOKEN = 'IArticuloRepository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticuloEntity,
      ArticuloDetalleEntity,
      GrupoArticuloEntity,
    ]),
  ],
  controllers: [
    ArticulosController,
    GruposController,
  ],
  providers: [
    {
      provide: ARTICULO_REPOSITORY_TOKEN,
      useClass: PostgresArticuloRepository,
    },
    {
      provide: GRUPO_ARTICULO_REPOSITORY_TOKEN,
      useClass: PostgresGrupoArticuloRepository,
    },
    ArticuloService,
    GrupoArticuloService,
  ],
  exports: [
    ArticuloService,
    GrupoArticuloService,
    ARTICULO_REPOSITORY_TOKEN,
    GRUPO_ARTICULO_REPOSITORY_TOKEN,
  ],
})
export class DepositoModule {} 