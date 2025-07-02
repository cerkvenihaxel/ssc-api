import * as CryptoJS from 'crypto-js';

// Clave secreta para el cifrado (debe ser la misma que en el frontend)
const SECRET_KEY = process.env.OBFUSCATION_KEY || 'default-secret-key-change-in-production';

/**
 * Utilidad para desofuscar IDs/UUIDs en el backend
 */
export class IdObfuscatorUtil {
  
  /**
   * Método para decodificar Base64
   */
  static decodeBase64(encodedId: string): string {
    try {
      // Restaurar caracteres Base64
      let restored = encodedId.replace(/[-_]/g, (match: string) => {
        return match === '-' ? '+' : '/';
      });
      
      // Agregar padding si es necesario
      while (restored.length % 4) {
        restored += '=';
      }
      
      return Buffer.from(restored, 'base64').toString();
    } catch (error) {
      console.error('Error decoding ID:', error);
      return encodedId;
    }
  }

  /**
   * Método para desencriptar AES
   */
  static decrypt(encryptedId: string): string {
    try {
      console.log(`[IdObfuscatorUtil] Attempting to decrypt: ${encryptedId.substring(0, 20)}...`);
      
      // Restaurar formato original
      const restored = encryptedId.replace(/[-_.]/g, (match: string) => {
        switch (match) {
          case '-': return '+';
          case '_': return '/';
          case '.': return '=';
          default: return match;
        }
      });
      
      console.log(`[IdObfuscatorUtil] Restored format: ${restored.substring(0, 20)}...`);
      
      const decrypted = CryptoJS.AES.decrypt(restored, SECRET_KEY);
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!result) {
        console.warn(`[IdObfuscatorUtil] Decryption returned empty result for: ${encryptedId.substring(0, 20)}...`);
        throw new Error('Decryption failed - empty result');
      }
      
      console.log(`[IdObfuscatorUtil] Successfully decrypted to: ${result}`);
      return result;
    } catch (error) {
      console.error(`[IdObfuscatorUtil] Error decrypting ID "${encryptedId.substring(0, 20)}...":`, error);
      console.log(`[IdObfuscatorUtil] Falling back to Base64 decode for: ${encryptedId.substring(0, 20)}...`);
      return this.decodeBase64(encryptedId); // Fallback a Base64
    }
  }

  /**
   * Verificar si una cadena es un UUID válido
   */
  static isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Desofuscar con checksum
   */
  static deobfuscateWithChecksum(obfuscatedId: string): { id: string; isValid: boolean } {
    try {
      const decrypted = this.decrypt(obfuscatedId);
      const parts = decrypted.split('|');
      
      if (parts.length !== 2) {
        throw new Error('Invalid checksum format');
      }
      
      const [id, checksum] = parts;
      const expectedChecksum = CryptoJS.MD5(id + SECRET_KEY).toString().substring(0, 8);
      
      if (checksum !== expectedChecksum) {
        console.warn(`[IdObfuscatorUtil] Checksum mismatch for ${obfuscatedId.substring(0, 20)}...`);
        return { id: decrypted, isValid: false };
      }
      
      return { id, isValid: true };
    } catch (error) {
      console.error(`[IdObfuscatorUtil] Error deobfuscating with checksum:`, error);
      return { id: obfuscatedId, isValid: false };
    }
  }

  /**
   * Método principal de desofuscación - intenta diferentes métodos
   */
  static deobfuscate(possiblyObfuscatedId: string): { id: string; isValid: boolean; wasObfuscated: boolean } {
    console.log(`[IdObfuscatorUtil] deobfuscate called with: ${possiblyObfuscatedId.substring(0, 20)}...`);
    
    // Si ya parece ser un UUID, no fue ofuscado
    if (this.isUUID(possiblyObfuscatedId)) {
      console.log(`[IdObfuscatorUtil] Input is already a UUID: ${possiblyObfuscatedId}`);
      return { id: possiblyObfuscatedId, isValid: true, wasObfuscated: false };
    }
    
    // Intentar desofuscar con checksum primero
    console.log(`[IdObfuscatorUtil] Attempting to deobfuscate with checksum method`);
    const checksumResult = this.deobfuscateWithChecksum(possiblyObfuscatedId);
    
    if (checksumResult.isValid && this.isUUID(checksumResult.id)) {
      console.log(`[IdObfuscatorUtil] Successfully deobfuscated with checksum: ${checksumResult.id}`);
      return { ...checksumResult, wasObfuscated: true };
    }
    
    // Intentar desencriptación directa
    console.log(`[IdObfuscatorUtil] Attempting direct decryption`);
    try {
      const decrypted = this.decrypt(possiblyObfuscatedId);
      if (this.isUUID(decrypted)) {
        console.log(`[IdObfuscatorUtil] Successfully decrypted directly: ${decrypted}`);
        return { id: decrypted, isValid: true, wasObfuscated: true };
      }
    } catch (error) {
      console.log(`[IdObfuscatorUtil] Direct decryption failed, trying Base64`);
    }
    
    // Intentar decodificación Base64
    try {
      const decoded = this.decodeBase64(possiblyObfuscatedId);
      if (this.isUUID(decoded)) {
        console.log(`[IdObfuscatorUtil] Successfully decoded with Base64: ${decoded}`);
        return { id: decoded, isValid: true, wasObfuscated: true };
      }
    } catch (error) {
      console.log(`[IdObfuscatorUtil] Base64 decoding failed`);
    }
    
    console.warn(`[IdObfuscatorUtil] Could not deobfuscate ID: ${possiblyObfuscatedId.substring(0, 20)}...`);
    return { id: possiblyObfuscatedId, isValid: false, wasObfuscated: false };
  }

  /**
   * Desofuscar automáticamente solo si el ID parece estar ofuscado
   */
  static smartDeobfuscate(possiblyObfuscatedId: string): { id: string; isValid: boolean; wasObfuscated: boolean } {
    return this.deobfuscate(possiblyObfuscatedId);
  }
} 