import { randomUUID } from 'crypto';

export class UserSession {
    constructor(
        public readonly sessionId: string,
        public readonly userId: string,
        public readonly deviceId: string,
        public readonly ipAddress: string,
        public readonly userAgent: string,
        public readonly createdAt: Date,
        public readonly logoutAt?: Date
    ) {}

    static create(
        userId: string,
        deviceId: string,
        ipAddress: string,
        userAgent: string,
        sessionId?: string,
        createdAt?: Date,
        logoutAt?: Date
    ): UserSession {
        return new UserSession(
            sessionId || randomUUID(),
            userId,
            deviceId,
            ipAddress,
            userAgent,
            createdAt || new Date(),
            logoutAt
        );
    }

    markAsLoggedOut(logoutAt: Date = new Date()): UserSession {
        return new UserSession(
            this.sessionId,
            this.userId,
            this.deviceId,
            this.ipAddress,
            this.userAgent,
            this.createdAt,
            logoutAt
        );
    }
} 