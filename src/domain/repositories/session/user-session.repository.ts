import { UserSession } from '../../models/session/user-session.model';

export interface IUserSessionRepository {
    save(session: UserSession): Promise<UserSession>;
    findBySessionId(sessionId: string): Promise<UserSession | null>;
    findActiveByUserId(userId: string): Promise<UserSession[]>;
    findActiveByDeviceId(deviceId: string): Promise<UserSession[]>;
    findByUserAndDevice(userId: string, deviceId: string): Promise<UserSession[]>;
    findByFingerprint(fingerprint: string): Promise<UserSession[]>;
    update(session: UserSession): Promise<UserSession>;
    updateActivity(sessionId: string): Promise<void>;
    revokeActiveSessionsForUser(userId: string, excludeSessionId?: string): Promise<void>;
    revokeActiveSessionsForDevice(deviceId: string, excludeSessionId?: string): Promise<void>;
    markExpiredSessionsAsInactive(): Promise<number>;
    cleanupOldSessions(daysOld: number): Promise<number>;
} 