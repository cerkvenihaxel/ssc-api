import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Especialidad } from '../../../domain/models/especialidad/especialidad.model';
import { IEspecialidadRepository } from '../../../domain/repositories/especialidad/especialidad.repository';

@Injectable()
export class PostgresEspecialidadRepository implements IEspecialidadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Especialidad[]> {
    const result = await this.pool.query('SELECT * FROM especialidades ORDER BY nombre ASC');
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(especialidadId: string): Promise<Especialidad | null> {
    const result = await this.pool.query(
      'SELECT * FROM especialidades WHERE especialidad_id = $1',
      [especialidadId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByNombre(nombre: string): Promise<Especialidad | null> {
    const result = await this.pool.query(
      'SELECT * FROM especialidades WHERE LOWER(nombre) = LOWER($1)',
      [nombre]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByCodigo(codigo: string): Promise<Especialidad | null> {
    const result = await this.pool.query(
      'SELECT * FROM especialidades WHERE codigo = $1',
      [codigo]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findActive(): Promise<Especialidad[]> {
    const result = await this.pool.query(
      'SELECT * FROM especialidades WHERE activa = true ORDER BY nombre ASC'
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async save(especialidad: Especialidad): Promise<Especialidad> {
    const result = await this.pool.query(
      `INSERT INTO especialidades (
        especialidad_id,
        nombre,
        descripcion,
        codigo,
        activa,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        especialidad.especialidadId,
        especialidad.nombre,
        especialidad.descripcion,
        especialidad.codigo,
        especialidad.activa,
        especialidad.createdAt,
        especialidad.updatedAt
      ]
    );

    return this.mapToEntity(result.rows[0]);
  }

  async update(especialidad: Especialidad): Promise<Especialidad> {
    const result = await this.pool.query(
      `UPDATE especialidades SET
        nombre = $1,
        descripcion = $2,
        codigo = $3,
        activa = $4,
        updated_at = $5
      WHERE especialidad_id = $6
      RETURNING *`,
      [
        especialidad.nombre,
        especialidad.descripcion,
        especialidad.codigo,
        especialidad.activa,
        especialidad.updatedAt,
        especialidad.especialidadId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Especialidad no encontrada');
    }

    return this.mapToEntity(result.rows[0]);
  }

  async delete(especialidadId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM especialidades WHERE especialidad_id = $1',
      [especialidadId]
    );

    if (result.rowCount === 0) {
      throw new Error('Especialidad no encontrada');
    }
  }

  private mapToEntity(row: any): Especialidad {
    return new Especialidad(
      row.especialidad_id,
      row.nombre,
      row.descripcion,
      row.codigo,
      row.activa,
      row.created_at,
      row.updated_at
    );
  }
} 