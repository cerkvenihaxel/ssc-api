import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IAfiliadoRepository } from '../../../domain/repositories/afiliado/afiliado.repository';
import { Afiliado } from '../../../domain/models/afiliado/afiliado.model';

@Injectable()
export class PostgresAfiliadoRepository implements IAfiliadoRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Afiliado[]> {
    const result = await this.pool.query(
      'SELECT * FROM afiliados ORDER BY creation_date DESC'
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(affiliateId: string): Promise<Afiliado | null> {
    const result = await this.pool.query(
      'SELECT * FROM afiliados WHERE affiliate_id = $1',
      [affiliateId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<Afiliado | null> {
    const result = await this.pool.query(
      'SELECT * FROM afiliados WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByCuil(cuil: string): Promise<Afiliado | null> {
    const result = await this.pool.query(
      'SELECT * FROM afiliados WHERE cuil = $1',
      [cuil]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByAffiliateNumber(affiliateNumber: string): Promise<Afiliado | null> {
    const result = await this.pool.query(
      'SELECT * FROM afiliados WHERE affiliate_number = $1',
      [affiliateNumber]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async save(afiliado: Afiliado): Promise<Afiliado> {
    const result = await this.pool.query(
      `INSERT INTO afiliados (
        affiliate_id,
        affiliate_number,
        affiliate_status,
        creation_date,
        last_update,
        cuil,
        cvu,
        document_type,
        document_number,
        document_country,
        gender,
        first_name,
        last_name,
        birth_date,
        nationality,
        email,
        password_hash,
        occupation,
        phone,
        picture,
        signed_tyc_version,
        signed_tyc_date,
        primary_address_id,
        created_by,
        updated_by,
        user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *`,
      [
        afiliado.id,
        afiliado.affiliateNumber,
        afiliado.affiliateStatus,
        afiliado.creationDate,
        afiliado.lastUpdate,
        afiliado.cuil,
        afiliado.cvu,
        afiliado.documentType,
        afiliado.documentNumber,
        afiliado.documentCountry,
        afiliado.gender,
        afiliado.firstName,
        afiliado.lastName,
        afiliado.birthDate,
        afiliado.nationality,
        afiliado.email,
        afiliado.passwordHash,
        afiliado.occupation,
        afiliado.phone,
        afiliado.picture,
        afiliado.signedTycVersion,
        afiliado.signedTycDate,
        afiliado.primaryAddressId,
        afiliado.createdBy,
        afiliado.updatedBy,
        afiliado.userId
      ]
    );

    return this.mapToEntity(result.rows[0]);
  }

  async update(afiliado: Afiliado): Promise<Afiliado> {
    const result = await this.pool.query(
      `UPDATE afiliados SET
        affiliate_number = $1,
        affiliate_status = $2,
        last_update = $3,
        cuil = $4,
        cvu = $5,
        document_type = $6,
        document_number = $7,
        document_country = $8,
        gender = $9,
        first_name = $10,
        last_name = $11,
        birth_date = $12,
        nationality = $13,
        email = $14,
        password_hash = $15,
        occupation = $16,
        phone = $17,
        picture = $18,
        primary_address_id = $19,
        updated_by = $20,
        user_id = $21
      WHERE affiliate_id = $22
      RETURNING *`,
      [
        afiliado.affiliateNumber,
        afiliado.affiliateStatus,
        afiliado.lastUpdate,
        afiliado.cuil,
        afiliado.cvu,
        afiliado.documentType,
        afiliado.documentNumber,
        afiliado.documentCountry,
        afiliado.gender,
        afiliado.firstName,
        afiliado.lastName,
        afiliado.birthDate,
        afiliado.nationality,
        afiliado.email,
        afiliado.passwordHash,
        afiliado.occupation,
        afiliado.phone,
        afiliado.picture,
        afiliado.primaryAddressId,
        afiliado.updatedBy,
        afiliado.userId,
        afiliado.id
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Afiliado no encontrado');
    }

    return this.mapToEntity(result.rows[0]);
  }

  async delete(affiliateId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM afiliados WHERE affiliate_id = $1',
      [affiliateId]
    );

    if (result.rowCount === 0) {
      throw new Error('Afiliado no encontrado');
    }
  }

  private mapToEntity(row: any): Afiliado {
    return new Afiliado(
      row.affiliate_id,
      row.affiliate_number,
      row.affiliate_status,
      row.creation_date,
      row.last_update,
      row.cuil,
      row.cvu,
      row.document_type,
      row.document_number,
      row.document_country,
      row.gender,
      row.first_name,
      row.last_name,
      row.birth_date,
      row.nationality,
      row.email,
      row.password_hash,
      row.occupation,
      row.phone,
      row.picture,
      row.signed_tyc_version,
      row.signed_tyc_date,
      row.primary_address_id,
      row.created_by,
      row.updated_by,
      row.user_id
    );
  }
} 