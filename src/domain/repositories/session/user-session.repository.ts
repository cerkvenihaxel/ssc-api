import { UserSession } from '../../models/session/user-session.model';

export interface IUserSessionRepository {
    save(session: UserSession): Promise<UserSession>;
    findBySessionId(sessionId: string): Promise<UserSession | null>;
    findActiveByUserId(userId: string): Promise<UserSession[]>;
    update(session: UserSession): Promise<UserSession>;
} 