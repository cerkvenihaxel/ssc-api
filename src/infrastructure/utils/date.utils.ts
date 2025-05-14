import { ConfigService } from '@nestjs/config';

export class DateUtils {
    private static configService = new ConfigService();

    static toLocalTimezone(date: Date): Date {
        const timezone = this.configService.get('LOCAL') || 'America/Buenos_Aires';
        return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    }

    static getCurrentLocalDate(): Date {
        return this.toLocalTimezone(new Date());
    }

    static formatForPostgres(date: Date): string {
        return date.toISOString();
    }
} 