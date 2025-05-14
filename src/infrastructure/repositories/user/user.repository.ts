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

    const user = result.rows[0];
    return new User(
      user.user_id,
      user.email,
      user.nombre,
      user.role_id,
      user.created_at
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return new User(
      user.user_id,
      user.email,
      user.nombre,
      user.role_id,
      user.created_at
    );
  }

  async save(user: User): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO usuarios (user_id, email, nombre, role_id, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.userId, user.email, user.nombre, user.roleId, user.createdAt]
    );

    const savedUser = result.rows[0];
    return new User(
      savedUser.user_id,
      savedUser.email,
      savedUser.nombre,
      savedUser.role_id,
      savedUser.created_at
    );
  }
} 