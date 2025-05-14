import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IUserSessionRepository } from '../../../domain/repositories/session/user-session.repository';
import { UserSession } from '../../../domain/models/session/user-session.model';

@Injectable()
export class PostgresUserSessionRepository implements IUserSessionRepository {
    constructor(private readonly pool: Pool) {}

    async save(session: UserSession): Promise<UserSession> {
        const result = await this.pool.query(
            `INSERT INTO user_sessions 
            (session_id, user_id, device_id, ip_address, user_agent, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                session.sessionId,
                session.userId,
                session.deviceId,
                session.ipAddress,
                session.userAgent,
                session.createdAt
            ]
        );

        return this.mapToEntity(result.rows[0]);
    }

    async findBySessionId(sessionId: string): Promise<UserSession | null> {
        const result = await this.pool.query(
            'SELECT * FROM user_sessions WHERE session_id = $1',
            [sessionId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(result.rows[0]);
    }

    async findActiveByUserId(userId: string): Promise<UserSession[]> {
        const result = await this.pool.query(
            'SELECT * FROM user_sessions WHERE user_id = $1 AND logout_at IS NULL',
            [userId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async update(session: UserSession): Promise<UserSession> {
        const result = await this.pool.query(
            `UPDATE user_sessions 
            SET logout_at = $1
            WHERE session_id = $2
            RETURNING *`,
            [session.logoutAt, session.sessionId]
        );

        if (result.rows.length === 0) {
            throw new Error('Session not found');
        }

        return this.mapToEntity(result.rows[0]);
    }

    private mapToEntity(row: any): UserSession {
        return new UserSession(
            row.session_id,
            row.user_id,
            row.device_id,
            row.ip_address,
            row.user_agent,
            row.created_at,
            row.logout_at
        );
    }
} 