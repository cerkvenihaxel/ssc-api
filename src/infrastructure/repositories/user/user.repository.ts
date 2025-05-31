import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { User } from '../../../domain/models/user/user.model';
import { IUserRepository } from '../../../domain/repositories/user/user.repository';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(userId: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM usuarios WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUser(result.rows[0]);
  }

  async save(user: User): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO usuarios 
      (user_id, email, nombre, password_hash, role_id, status, last_login, email_verified, created_at, updated_at, created_by, updated_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        user.userId, 
        user.email, 
        user.nombre, 
        user.passwordHash,
        user.roleId, 
        user.status,
        user.lastLogin,
        user.emailVerified,
        user.createdAt,
        user.updatedAt,
        user.createdBy,
        user.updatedBy
      ]
    );

    return this.mapToUser(result.rows[0]);
  }

  async update(user: User): Promise<User> {
    const result = await this.pool.query(
      `UPDATE usuarios 
      SET email = $2, nombre = $3, password_hash = $4, role_id = $5, status = $6, 
          last_login = $7, email_verified = $8, updated_at = $9, updated_by = $10
      WHERE user_id = $1 
      RETURNING *`,
      [
        user.userId,
        user.email,
        user.nombre,
        user.passwordHash,
        user.roleId,
        user.status,
        user.lastLogin,
        user.emailVerified,
        user.updatedAt,
        user.updatedBy
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return this.mapToUser(result.rows[0]);
  }

  async delete(userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM usuarios WHERE user_id = $1',
      [userId]
    );
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE usuarios SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT p.nombre 
       FROM usuarios u
       JOIN roles r ON u.role_id = r.role_id
       JOIN roles_permisos rp ON r.role_id = rp.role_id
       JOIN permisos p ON rp.permiso_id = p.permiso_id
       WHERE u.user_id = $1`,
      [userId]
    );

    return result.rows.map(row => row.nombre);
  }

  async getUserRole(userId: string): Promise<{ id: number; name: string; description: string }> {
    const result = await this.pool.query(
      `SELECT r.role_id, r.role_name, r.description 
       FROM usuarios u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Rol de usuario no encontrado');
    }

    const row = result.rows[0];
    return {
      id: row.role_id,
      name: row.role_name,
      description: row.description || ''
    };
  }

  private mapToUser(row: any): User {
    return new User(
      row.user_id,
      row.email,
      row.nombre,
      row.password_hash,
      row.role_id,
      row.status || 'active',
      row.last_login,
      row.email_verified || false,
      row.created_at,
      row.updated_at,
      row.created_by,
      row.updated_by
    );
  }
} 