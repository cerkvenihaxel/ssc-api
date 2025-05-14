import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IPermisoRepository } from '../../../domain/repositories/permiso/permiso.repository';
import { Permiso } from '../../../domain/models/permiso/permiso.model';

@Injectable()
export class PostgresPermisoRepository implements IPermisoRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Permiso[]> {
    const result = await this.pool.query(
      'SELECT * FROM permisos ORDER BY permiso_id'
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(permisoId: number): Promise<Permiso | null> {
    const result = await this.pool.query(
      'SELECT * FROM permisos WHERE permiso_id = $1',
      [permisoId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByNombre(nombre: string): Promise<Permiso | null> {
    const result = await this.pool.query(
      'SELECT * FROM permisos WHERE nombre = $1',
      [nombre]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async save(permiso: Permiso): Promise<Permiso> {
    const result = await this.pool.query(
      `INSERT INTO permisos (nombre, descripcion) 
       VALUES ($1, $2) 
       RETURNING *`,
      [permiso.nombre, permiso.descripcion]
    );

    return this.mapToEntity(result.rows[0]);
  }

  async update(permiso: Permiso): Promise<Permiso> {
    const result = await this.pool.query(
      `UPDATE permisos 
       SET nombre = $1, descripcion = $2
       WHERE permiso_id = $3 
       RETURNING *`,
      [permiso.nombre, permiso.descripcion, permiso.permisoId]
    );

    if (result.rows.length === 0) {
      throw new Error('Permiso no encontrado');
    }

    return this.mapToEntity(result.rows[0]);
  }

  async delete(permisoId: number): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM permisos WHERE permiso_id = $1',
      [permisoId]
    );

    if (result.rowCount === 0) {
      throw new Error('Permiso no encontrado');
    }
  }

  private mapToEntity(row: any): Permiso {
    return new Permiso(
      row.permiso_id,
      row.nombre,
      row.descripcion
    );
  }
} 