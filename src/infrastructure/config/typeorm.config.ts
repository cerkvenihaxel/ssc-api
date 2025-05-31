import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Address } from '@domain/entities/address.entity';
import { Affiliate } from '@domain/entities/affiliate.entity';
import { ProveedorEntity, EspecialidadEntity } from '../persistence/postgres/entities/proveedor.entity';
import { Usuario } from '../persistence/postgres/entities/usuario.entity';
import { join } from 'path';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'ssc_db',
  entities: [Address, Affiliate, ProveedorEntity, EspecialidadEntity, Usuario],
  migrations: [join(__dirname, '../persistence/postgres/migrations/*.{ts,js}')],
  synchronize: false, // Disabled to prevent automatic schema changes
  logging: process.env.NODE_ENV !== 'production',
  migrationsRun: false, // Disabled - use manual script.sql instead
  dropSchema: false, // Prevent accidental schema drops
}; 