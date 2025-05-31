import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Medico } from '../../../domain/models/medico/medico.model';
import { IMedicoRepository } from '../../../domain/repositories/medico/medico.repository';

@Injectable()
export class PostgresMedicoRepository implements IMedicoRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Medico[]> {
    const result = await this.pool.query(`
      SELECT 
        m.medico_id,
        m.matricula,
        m.especialidad_id,
        m.first_name,
        m.last_name,
        u.email,
        m.phone,
        m.picture,
        m.creation_date,
        m.last_update,
        m.created_by,
        m.updated_by,
        m.user_id,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.last_login as user_last_login,
        u.created_at as user_created_at,
        e.nombre as especialidad_nombre 
      FROM medicos m
      LEFT JOIN usuarios u ON m.user_id = u.user_id
      LEFT JOIN especialidades e ON m.especialidad_id = e.especialidad_id
      ORDER BY m.last_name ASC, m.first_name ASC
    `);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(medicoId: string): Promise<Medico | null> {
    const result = await this.pool.query(`
      SELECT 
        m.medico_id,
        m.matricula,
        m.especialidad_id,
        m.first_name,
        m.last_name,
        u.email,
        m.phone,
        m.picture,
        m.creation_date,
        m.last_update,
        m.created_by,
        m.updated_by,
        m.user_id,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.last_login as user_last_login,
        u.created_at as user_created_at
      FROM medicos m
      LEFT JOIN usuarios u ON m.user_id = u.user_id
      WHERE m.medico_id = $1
    `, [medicoId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByMatricula(matricula: string): Promise<Medico | null> {
    const result = await this.pool.query(`
      SELECT 
        m.medico_id,
        m.matricula,
        m.especialidad_id,
        m.first_name,
        m.last_name,
        u.email,
        m.phone,
        m.picture,
        m.creation_date,
        m.last_update,
        m.created_by,
        m.updated_by,
        m.user_id
      FROM medicos m
      LEFT JOIN usuarios u ON m.user_id = u.user_id
      WHERE m.matricula = $1
    `, [matricula]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<Medico | null> {
    const result = await this.pool.query(`
      SELECT 
        m.medico_id,
        m.matricula,
        m.especialidad_id,
        m.first_name,
        m.last_name,
        u.email,
        m.phone,
        m.picture,
        m.creation_date,
        m.last_update,
        m.created_by,
        m.updated_by,
        m.user_id
      FROM medicos m
      INNER JOIN usuarios u ON m.user_id = u.user_id
      WHERE LOWER(u.email) = LOWER($1)
    `, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByEspecialidad(especialidadId: string): Promise<Medico[]> {
    const result = await this.pool.query(`
      SELECT 
        m.medico_id,
        m.matricula,
        m.especialidad_id,
        m.first_name,
        m.last_name,
        u.email,
        m.phone,
        m.picture,
        m.creation_date,
        m.last_update,
        m.created_by,
        m.updated_by,
        m.user_id
      FROM medicos m
      LEFT JOIN usuarios u ON m.user_id = u.user_id
      WHERE m.especialidad_id = $1 
      ORDER BY m.last_name ASC, m.first_name ASC
    `, [especialidadId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByObraSocial(obraSocialId: string): Promise<Medico[]> {
    const result = await this.pool.query(`
      SELECT 
        m.medico_id,
        m.matricula,
        m.especialidad_id,
        m.first_name,
        m.last_name,
        u.email,
        m.phone,
        m.picture,
        m.creation_date,
        m.last_update,
        m.created_by,
        m.updated_by,
        m.user_id
      FROM medicos m
      LEFT JOIN usuarios u ON m.user_id = u.user_id
      INNER JOIN medicos_obras_sociales mos ON m.medico_id = mos.medico_id
      WHERE mos.healthcare_provider_id = $1 AND mos.association_status = 'active'
      ORDER BY m.last_name ASC, m.first_name ASC
    `, [obraSocialId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async save(medico: Medico): Promise<Medico> {
    const result = await this.pool.query(
      `INSERT INTO medicos (
        medico_id,
        matricula,
        especialidad_id,
        first_name,
        last_name,
        phone,
        picture,
        user_id,
        creation_date,
        last_update,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        medico_id,
        matricula,
        especialidad_id,
        first_name,
        last_name,
        phone,
        picture,
        user_id,
        creation_date,
        last_update,
        created_by,
        updated_by`,
      [
        medico.medicoId,
        medico.matricula,
        medico.especialidadId,
        medico.firstName,
        medico.lastName,
        medico.phone,
        medico.picture,
        medico.userId,
        medico.creationDate,
        medico.lastUpdate,
        medico.createdBy,
        medico.updatedBy
      ]
    );

    // Obtener el email del usuario asociado
    const medicoWithEmail = await this.findById(result.rows[0].medico_id);
    return medicoWithEmail!;
  }

  async update(medico: Medico): Promise<Medico> {
    const result = await this.pool.query(
      `UPDATE medicos SET
        matricula = $1,
        especialidad_id = $2,
        first_name = $3,
        last_name = $4,
        phone = $5,
        picture = $6,
        last_update = $7,
        updated_by = $8
      WHERE medico_id = $9
      RETURNING *`,
      [
        medico.matricula,
        medico.especialidadId,
        medico.firstName,
        medico.lastName,
        medico.phone,
        medico.picture,
        medico.lastUpdate,
        medico.updatedBy,
        medico.medicoId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Médico no encontrado');
    }

    // Obtener el médico completo con email
    const medicoWithEmail = await this.findById(medico.medicoId);
    return medicoWithEmail!;
  }

  async delete(medicoId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM medicos WHERE medico_id = $1',
      [medicoId]
    );

    if (result.rowCount === 0) {
      throw new Error('Médico no encontrado');
    }
  }

  async associateWithObraSocial(medicoId: string, obraSocialId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO medicos_obras_sociales (id, medico_id, healthcare_provider_id, association_status, association_date)
       VALUES (gen_random_uuid(), $1, $2, 'active', CURRENT_TIMESTAMP)
       ON CONFLICT (medico_id, healthcare_provider_id) 
       DO UPDATE SET association_status = 'active', association_date = CURRENT_TIMESTAMP`,
      [medicoId, obraSocialId]
    );
  }

  async dissociateFromObraSocial(medicoId: string, obraSocialId: string): Promise<void> {
    await this.pool.query(
      `UPDATE medicos_obras_sociales 
       SET association_status = 'inactive' 
       WHERE medico_id = $1 AND healthcare_provider_id = $2`,
      [medicoId, obraSocialId]
    );
  }

  async getObrasSocialesAssociated(medicoId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT healthcare_provider_id FROM medicos_obras_sociales 
       WHERE medico_id = $1 AND association_status = 'active'`,
      [medicoId]
    );
    return result.rows.map(row => row.healthcare_provider_id);
  }

  private mapToEntity(row: any): Medico {
    return new Medico(
      row.medico_id,
      row.matricula,
      row.especialidad_id,
      row.first_name,
      row.last_name,
      row.email || '', // Email viene del JOIN con usuarios
      row.phone,
      row.picture,
      row.user_id,
      row.creation_date,
      row.last_update,
      row.created_by,
      row.updated_by,
      // Información del usuario asociado
      row.user_status,
      row.user_email_verified,
      row.user_last_login,
      row.user_created_at
    );
  }
} 