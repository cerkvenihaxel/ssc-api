import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IObraSocialRepository } from '../../../domain/repositories/obra-social/obra-social.repository';
import { ObraSocial } from '../../../domain/models/obra-social/obra-social.model';

@Injectable()
export class PostgresObraSocialRepository implements IObraSocialRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<ObraSocial[]> {
    const result = await this.pool.query(
      'SELECT * FROM obras_sociales ORDER BY created_at DESC'
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(healthcareProviderId: string): Promise<ObraSocial | null> {
    const result = await this.pool.query(
      'SELECT * FROM obras_sociales WHERE healthcare_provider_id = $1',
      [healthcareProviderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByName(name: string): Promise<ObraSocial | null> {
    const result = await this.pool.query(
      'SELECT * FROM obras_sociales WHERE name = $1',
      [name]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async save(obraSocial: ObraSocial): Promise<ObraSocial> {
    const result = await this.pool.query(
      `INSERT INTO obras_sociales (
        healthcare_provider_id,
        name,
        status,
        contact_phone,
        contact_email,
        address,
        created_at,
        updated_at,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        obraSocial.healthcareProviderId,
        obraSocial.name,
        obraSocial.status,
        obraSocial.contactPhone,
        obraSocial.contactEmail,
        obraSocial.address,
        obraSocial.createdAt,
        obraSocial.updatedAt,
        obraSocial.createdBy,
        obraSocial.updatedBy
      ]
    );

    return this.mapToEntity(result.rows[0]);
  }

  async update(obraSocial: ObraSocial): Promise<ObraSocial> {
    const result = await this.pool.query(
      `UPDATE obras_sociales SET
        name = $1,
        status = $2,
        contact_phone = $3,
        contact_email = $4,
        address = $5,
        updated_at = $6,
        updated_by = $7
      WHERE healthcare_provider_id = $8
      RETURNING *`,
      [
        obraSocial.name,
        obraSocial.status,
        obraSocial.contactPhone,
        obraSocial.contactEmail,
        obraSocial.address,
        obraSocial.updatedAt,
        obraSocial.updatedBy,
        obraSocial.healthcareProviderId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Obra social no encontrada');
    }

    return this.mapToEntity(result.rows[0]);
  }

  async delete(healthcareProviderId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM obras_sociales WHERE healthcare_provider_id = $1',
      [healthcareProviderId]
    );

    if (result.rowCount === 0) {
      throw new Error('Obra social no encontrada');
    }
  }

  private mapToEntity(row: any): ObraSocial {
    return new ObraSocial(
      row.healthcare_provider_id,
      row.name,
      row.status,
      row.contact_phone,
      row.contact_email,
      row.address,
      row.created_at,
      row.updated_at,
      row.created_by,
      row.updated_by
    );
  }
} 