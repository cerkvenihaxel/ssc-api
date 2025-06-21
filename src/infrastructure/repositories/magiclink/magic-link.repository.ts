import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { MagicLink } from 'src/domain/models/magiclink/magic-link.model';
import { IMagicLinkRepository } from 'src/domain/repositories/magiclink/magic-link.repository';

@Injectable()
export class PostgresMagicLinkRepository implements IMagicLinkRepository {
  constructor(private readonly pool: Pool) {}

  async findById(magicLinkId: string): Promise<MagicLink | null> {
    const result = await this.pool.query(
      'SELECT * FROM magic_links WHERE link_id = $1',
      [magicLinkId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByToken(token: string): Promise<MagicLink | null> {
    const result = await this.pool.query(
      'SELECT * FROM magic_links WHERE token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findActiveByUserId(userId: string): Promise<MagicLink[]> {
    const result = await this.pool.query(
      'SELECT * FROM magic_links WHERE user_id = $1 AND is_active = true AND used_at IS NULL AND expires_at > NOW()',
      [userId]
    );

    return result.rows.map(row => this.mapToEntity(row));
  }

  async save(magicLink: MagicLink): Promise<MagicLink> {
    const result = await this.pool.query(
      `INSERT INTO magic_links 
      (link_id, user_id, token, email, created_at, expires_at, requested_ip, request_user_agent, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        magicLink.magicLinkId,
        magicLink.userId,
        magicLink.token,
        '', // email - se puede obtener del usuario si es necesario
        magicLink.createdAt,
        magicLink.expiresAt,
        magicLink.requestedIp || null,
        magicLink.requestUserAgent || null,
        magicLink.isActive
      ]
    );

    return this.mapToEntity(result.rows[0]);
  }

  async update(magicLink: MagicLink): Promise<MagicLink> {
    const result = await this.pool.query(
      `UPDATE magic_links 
      SET used_at = $1, used_ip = $2, used_user_agent = $3, is_active = $4
      WHERE link_id = $5 
      RETURNING *`,
      [
        magicLink.usedAt,
        magicLink.usedIp || null,
        magicLink.userAgent || null,
        magicLink.isActive,
        magicLink.magicLinkId
      ]
    );

    return this.mapToEntity(result.rows[0]);
  }

  private mapToEntity(row: any): MagicLink {
    return new MagicLink(
      row.link_id,
      row.user_id,
      row.token,
      row.created_at,
      row.expires_at,
      row.used_at,
      row.used_ip,
      row.used_user_agent,
      row.requested_ip,
      row.request_user_agent,
      row.is_active
    );
  }
} 