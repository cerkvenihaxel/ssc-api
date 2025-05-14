import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

export class UserSession {
    private static configService = new ConfigService();

    constructor(
        public readonly sessionId: string,
        public readonly userId: string,
        public readonly deviceId: string,
        public readonly ipAddress: string,
        public readonly userAgent: string,
        public readonly createdAt: Date,
        public readonly logoutAt?: Date
    ) {}

    private static getLocalDate(date?: Date): Date {
        const timezone = this.configService.get('LOCAL') || 'America/Buenos_Aires';
        const now = date || new Date();
        return new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    }

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
            this.getLocalDate(createdAt),
            logoutAt ? this.getLocalDate(logoutAt) : undefined
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
            UserSession.getLocalDate(logoutAt)
        );
    }
} 