import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ActivityLogService } from '../../application/services/activity/activity-log.service';

interface ActivityMetadata {
  action: string;
  entityType?: string;
  entityIdField?: string; // Campo del resultado que contiene el ID de la entidad
  skipLogging?: boolean;
}

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(ActivityLogService)
    private readonly activityLogService: ActivityLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Obtener metadatos de actividad del handler o controller
    const activityMetadata = this.reflector.getAllAndOverride<ActivityMetadata>(
      'activity',
      [handler, controller],
    );

    if (!activityMetadata || activityMetadata.skipLogging) {
      return next.handle();
    }

    const userId = request.user?.userId;
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.get('User-Agent');

    return next.handle().pipe(
      tap({
        next: (data) => {
          try {
            let entityId: string | undefined;
            
            if (activityMetadata.entityIdField && data) {
              // Extraer el ID de la entidad del resultado
              entityId = this.extractEntityId(data, activityMetadata.entityIdField);
            } else if (request.params?.id) {
              // Si hay un ID en los parámetros de la ruta
              entityId = request.params.id;
            }

            // Registrar la actividad de forma asíncrona
            this.activityLogService.logActivity({
              userId,
              action: activityMetadata.action,
              entityType: activityMetadata.entityType,
              entityId,
              newValues: this.sanitizeData(data),
              ipAddress,
              userAgent,
            }).catch((error) => {
              console.error('Error logging activity:', error);
            });
          } catch (error) {
            console.error('Error in activity logging interceptor:', error);
          }
        },
        error: (error) => {
          // También registrar errores si es relevante
          if (activityMetadata.action.includes('DELETE') || activityMetadata.action.includes('UPDATE')) {
            this.activityLogService.logActivity({
              userId,
              action: `${activityMetadata.action}_FAILED`,
              entityType: activityMetadata.entityType,
              entityId: request.params?.id,
              newValues: { error: error.message },
              ipAddress,
              userAgent,
            }).catch((logError) => {
              console.error('Error logging failed activity:', logError);
            });
          }
        },
      }),
    );
  }

  private extractEntityId(data: any, fieldPath: string): string | undefined {
    if (!data || typeof data !== 'object') return undefined;
    
    const parts = fieldPath.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'string' ? current : undefined;
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    // Crear una copia y eliminar información sensible
    const sanitized = { ...data };
    
    // Eliminar campos sensibles
    const sensitiveFields = [
      'password', 'password_hash', 'token', 'secret', 'key', 
      'authorization', 'cookie', 'session'
    ];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }
    
    // Limitar el tamaño de los datos para evitar logs muy grandes
    const maxSize = 1000; // caracteres
    const serialized = JSON.stringify(sanitized);
    
    if (serialized.length > maxSize) {
      return {
        ...sanitized,
        _truncated: `Data truncated (original size: ${serialized.length} chars)`,
      };
    }
    
    return sanitized;
  }
}

// Decorador para marcar métodos que deben registrar actividad
export const LogActivity = (metadata: ActivityMetadata) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (key && descriptor) {
      // Aplicado a un método
      Reflect.defineMetadata('activity', metadata, descriptor.value);
    } else {
      // Aplicado a una clase
      Reflect.defineMetadata('activity', metadata, target);
    }
  };
}; 