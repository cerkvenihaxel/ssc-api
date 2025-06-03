import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IUserSessionRepository } from '../../../domain/repositories/session/user-session.repository';
import { UserSession, ClientInfo } from '../../../domain/models/session/user-session.model';
import { DateUtils } from '../../utils/date.utils';

@Injectable()
export class PostgresUserSessionRepository implements IUserSessionRepository {
    constructor(private readonly pool: Pool) {}

    async save(session: UserSession): Promise<UserSession> {
        const result = await this.pool.query(
            `INSERT INTO user_sessions 
            (session_id, user_id, device_id, ip_address, user_agent, created_at, is_active, expires_at, last_activity, fingerprint, client_info) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                session.sessionId,
                session.userId,
                session.deviceId,
                session.ipAddress,
                session.userAgent,
                DateUtils.formatForPostgres(session.createdAt),
                session.isActive,
                session.expiresAt ? DateUtils.formatForPostgres(session.expiresAt) : null,
                session.lastActivity ? DateUtils.formatForPostgres(session.lastActivity) : null,
                session.fingerprint,
                JSON.stringify(session.clientInfo || {})
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
            'SELECT * FROM user_sessions WHERE user_id = $1 AND is_active = true AND logout_at IS NULL ORDER BY created_at DESC',
            [userId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findActiveByDeviceId(deviceId: string): Promise<UserSession[]> {
        const result = await this.pool.query(
            'SELECT * FROM user_sessions WHERE device_id = $1 AND is_active = true AND logout_at IS NULL ORDER BY created_at DESC',
            [deviceId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findByUserAndDevice(userId: string, deviceId: string): Promise<UserSession[]> {
        const result = await this.pool.query(
            'SELECT * FROM user_sessions WHERE user_id = $1 AND device_id = $2 ORDER BY created_at DESC',
            [userId, deviceId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findByFingerprint(fingerprint: string): Promise<UserSession[]> {
        const result = await this.pool.query(
            'SELECT * FROM user_sessions WHERE fingerprint = $1 AND is_active = true ORDER BY created_at DESC',
            [fingerprint]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async update(session: UserSession): Promise<UserSession> {
        const result = await this.pool.query(
            `UPDATE user_sessions 
            SET logout_at = $1, is_active = $2, last_activity = $3
            WHERE session_id = $4
            RETURNING *`,
            [
                session.logoutAt ? DateUtils.formatForPostgres(session.logoutAt) : null,
                session.isActive,
                session.lastActivity ? DateUtils.formatForPostgres(session.lastActivity) : null,
                session.sessionId
            ]
        );

        if (result.rows.length === 0) {
            throw new Error('Session not found');
        }

        return this.mapToEntity(result.rows[0]);
    }

    async updateActivity(sessionId: string): Promise<void> {
        await this.pool.query(
            'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
            [sessionId]
        );
    }

    async revokeActiveSessionsForUser(userId: string, excludeSessionId?: string): Promise<void> {
        let query = 'UPDATE user_sessions SET is_active = false, logout_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_active = true';
        const params: any[] = [userId];

        if (excludeSessionId) {
            query += ' AND session_id != $2';
            params.push(excludeSessionId);
        }

        await this.pool.query(query, params);
    }

    async revokeActiveSessionsForDevice(deviceId: string, excludeSessionId?: string): Promise<void> {
        let query = 'UPDATE user_sessions SET is_active = false, logout_at = CURRENT_TIMESTAMP WHERE device_id = $1 AND is_active = true';
        const params: any[] = [deviceId];

        if (excludeSessionId) {
            query += ' AND session_id != $2';
            params.push(excludeSessionId);
        }

        await this.pool.query(query, params);
    }

    async markExpiredSessionsAsInactive(): Promise<number> {
        const result = await this.pool.query(
            'UPDATE user_sessions SET is_active = false WHERE is_active = true AND expires_at < CURRENT_TIMESTAMP'
        );
        return result.rowCount || 0;
    }

    async cleanupOldSessions(daysOld: number): Promise<number> {
        const result = await this.pool.query(
            'DELETE FROM user_sessions WHERE created_at < CURRENT_TIMESTAMP - INTERVAL \'$1 days\'',
            [daysOld]
        );
        return result.rowCount || 0;
    }

    private mapToEntity(row: any): UserSession {
        let clientInfo: ClientInfo = {};
        
        try {
            if (row.client_info) {
                if (typeof row.client_info === 'string') {
                    // Si es string, intentar parsear
                    clientInfo = JSON.parse(row.client_info);
                } else if (typeof row.client_info === 'object' && row.client_info !== null) {
                    // Si ya es objeto, usar directamente
                    clientInfo = row.client_info;
                } else {
                    // Si es null, undefined, o cualquier otro tipo, usar objeto vacío
                    clientInfo = {};
                }
            }
        } catch (error) {
            // Si el JSON es inválido, log el error y usar un objeto vacío
            console.warn('Invalid JSON in client_info for session:', row.session_id, 'Data:', row.client_info, 'Error:', error.message);
            clientInfo = {};
        }

        return new UserSession(
            row.session_id,
            row.user_id,
            row.device_id,
            row.ip_address,
            row.user_agent,
            DateUtils.toLocalTimezone(row.created_at),
            row.logout_at ? DateUtils.toLocalTimezone(row.logout_at) : undefined,
            row.is_active || false,
            row.expires_at ? DateUtils.toLocalTimezone(row.expires_at) : undefined,
            row.last_activity ? DateUtils.toLocalTimezone(row.last_activity) : undefined,
            row.fingerprint,
            clientInfo
        );
    }
} 