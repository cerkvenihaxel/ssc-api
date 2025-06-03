import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface ClientInfo {
  browser?: string;
  os?: string;
  device?: string;
  language?: string;
  timezone?: string;
  screenResolution?: string;
}

export class UserSession {
    private static configService = new ConfigService();

    constructor(
        public readonly sessionId: string,
        public readonly userId: string,
        public readonly deviceId: string,
        public readonly ipAddress: string,
        public readonly userAgent: string,
        public readonly createdAt: Date,
        public readonly logoutAt?: Date,
        public readonly isActive: boolean = true,
        public readonly expiresAt?: Date,
        public readonly lastActivity?: Date,
        public readonly fingerprint?: string,
        public readonly clientInfo?: ClientInfo
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
        options: {
            sessionId?: string;
            createdAt?: Date;
            logoutAt?: Date;
            isActive?: boolean;
            expiresAt?: Date;
            lastActivity?: Date;
            fingerprint?: string;
            clientInfo?: ClientInfo;
        } = {}
    ): UserSession {
        const now = this.getLocalDate();
        const expiresAt = options.expiresAt || new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas por defecto

        return new UserSession(
            options.sessionId || randomUUID(),
            userId,
            deviceId,
            ipAddress,
            userAgent,
            this.getLocalDate(options.createdAt),
            options.logoutAt ? this.getLocalDate(options.logoutAt) : undefined,
            options.isActive ?? true,
            expiresAt,
            this.getLocalDate(options.lastActivity || now),
            options.fingerprint,
            options.clientInfo
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
            UserSession.getLocalDate(logoutAt),
            false, // isActive = false
            this.expiresAt,
            this.lastActivity,
            this.fingerprint,
            this.clientInfo
        );
    }

    markAsInactive(): UserSession {
        return new UserSession(
            this.sessionId,
            this.userId,
            this.deviceId,
            this.ipAddress,
            this.userAgent,
            this.createdAt,
            this.logoutAt,
            false, // isActive = false
            this.expiresAt,
            this.lastActivity,
            this.fingerprint,
            this.clientInfo
        );
    }

    updateActivity(lastActivity: Date = new Date()): UserSession {
        return new UserSession(
            this.sessionId,
            this.userId,
            this.deviceId,
            this.ipAddress,
            this.userAgent,
            this.createdAt,
            this.logoutAt,
            this.isActive,
            this.expiresAt,
            UserSession.getLocalDate(lastActivity),
            this.fingerprint,
            this.clientInfo
        );
    }

    isExpired(): boolean {
        if (!this.expiresAt) return false;
        return new Date() > this.expiresAt;
    }

    isValid(): boolean {
        return this.isActive && !this.isExpired() && !this.logoutAt;
    }
} 