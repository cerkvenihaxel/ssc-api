import * as crypto from 'crypto';
import { ClientInfo } from '../../domain/models/session/user-session.model';

export class FingerprintUtil {
    /**
     * Genera un fingerprint único del dispositivo basado en múltiples factores
     */
    static generateFingerprint(
        userAgent: string,
        ipAddress: string,
        clientInfo?: ClientInfo
    ): string {
        const components = [
            userAgent,
            ipAddress,
            clientInfo?.browser || '',
            clientInfo?.os || '',
            clientInfo?.device || '',
            clientInfo?.language || '',
            clientInfo?.timezone || '',
            clientInfo?.screenResolution || ''
        ];

        const fingerprint = components.join('|');
        return crypto.createHash('sha256').update(fingerprint).digest('hex');
    }

    /**
     * Genera un device ID basado en el fingerprint y información adicional
     */
    static generateDeviceId(fingerprint: string, userId: string): string {
        const deviceString = `${fingerprint}-${userId}`;
        return crypto.createHash('md5').update(deviceString).digest('hex');
    }

    /**
     * Extrae información del cliente desde el User-Agent
     */
    static parseUserAgent(userAgent: string): Partial<ClientInfo> {
        const clientInfo: Partial<ClientInfo> = {};

        // Detectar navegador
        if (userAgent.includes('Chrome')) {
            clientInfo.browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            clientInfo.browser = 'Firefox';
        } else if (userAgent.includes('Safari')) {
            clientInfo.browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
            clientInfo.browser = 'Edge';
        }

        // Detectar OS
        if (userAgent.includes('Windows')) {
            clientInfo.os = 'Windows';
        } else if (userAgent.includes('Mac OS')) {
            clientInfo.os = 'macOS';
        } else if (userAgent.includes('Linux')) {
            clientInfo.os = 'Linux';
        } else if (userAgent.includes('Android')) {
            clientInfo.os = 'Android';
        } else if (userAgent.includes('iOS')) {
            clientInfo.os = 'iOS';
        }

        // Detectar tipo de dispositivo
        if (userAgent.includes('Mobile')) {
            clientInfo.device = 'Mobile';
        } else if (userAgent.includes('Tablet')) {
            clientInfo.device = 'Tablet';
        } else {
            clientInfo.device = 'Desktop';
        }

        return clientInfo;
    }

    /**
     * Valida si un fingerprint es consistente con la sesión
     */
    static validateFingerprint(
        currentFingerprint: string,
        sessionFingerprint: string,
        tolerance: number = 0.8
    ): boolean {
        if (currentFingerprint === sessionFingerprint) {
            return true;
        }

        // Implementar lógica de tolerancia para cambios menores
        // (por ejemplo, actualizaciones de navegador)
        const similarity = this.calculateSimilarity(currentFingerprint, sessionFingerprint);
        return similarity >= tolerance;
    }

    private static calculateSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) {
            return 1.0;
        }
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    private static levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
} 