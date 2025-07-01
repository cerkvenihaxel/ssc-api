import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ActivityLogService } from '../../application/services/activity/activity-log.service';
import { Reflector } from '@nestjs/core';

export const SKIP_ACTIVITY_LOG = 'skipActivityLog';
export const SkipActivityLog = () => Reflector.createDecorator<boolean>();

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLoggingInterceptor.name);

  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Skip logging if decorator is present
    const skipActivityLog = this.reflector.get<boolean>(
      SKIP_ACTIVITY_LOG,
      context.getHandler(),
    );

    if (skipActivityLog) {
      return next.handle();
    }

    const method = request.method;
    const url = request.url;
    const user = request.user;
    const body = request.body;
    const params = request.params;
    const query = request.query;

    // Only log modifying operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip activity logging endpoints to prevent infinite loops
    if (url.includes('/activities') || url.includes('/logs')) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        try {
          this.logActivity(
            method,
            url,
            user,
            body,
            params,
            query,
            data,
            request,
            response.statusCode,
            duration,
            true
          );
        } catch (error) {
          this.logger.error('Error logging successful activity:', error);
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        try {
          this.logActivity(
            method,
            url,
            user,
            body,
            params,
            query,
            null,
            request,
            error.status || 500,
            duration,
            false,
            error.message
          );
        } catch (logError) {
          this.logger.error('Error logging failed activity:', logError);
        }

        throw error;
      })
    );
  }

  private async logActivity(
    method: string,
    url: string,
    user: any,
    body: any,
    params: any,
    query: any,
    responseData: any,
    request: any,
    statusCode: number,
    duration: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { action, entityType, entityId } = this.extractEntityInfo(method, url, params, body);
      
      // Determine old and new values based on operation
      let oldValues = null;
      let newValues = null;

      if (method === 'POST') {
        newValues = this.sanitizeData(body);
      } else if (method === 'PUT' || method === 'PATCH') {
        newValues = this.sanitizeData(body);
        // For updates, we don't have old values in the interceptor
        // This would require a more sophisticated implementation
      } else if (method === 'DELETE') {
        oldValues = { deleted: true, entityId };
      }

      // Additional metadata
      const metadata = {
        method,
        url,
        statusCode,
        duration,
        success,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
        ...(query && Object.keys(query).length > 0 && { queryParams: query }),
        ...(errorMessage && { error: errorMessage }),
      };

      await this.activityLogService.logActivity({
        userId: user?.userId || user?.user_id || null,
        action,
        entityType,
        entityId,
        oldValues,
        newValues: {
          ...newValues,
          _metadata: metadata
        },
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
      });

    } catch (error) {
      this.logger.error('Failed to log activity:', error);
    }
  }

  private extractEntityInfo(method: string, url: string, params: any, body: any): {
    action: string;
    entityType: string;
    entityId: string | null;
  } {
    // Parse URL to extract entity information
    const urlParts = url.split('/').filter(part => part && part !== 'api' && part !== 'v1');
    
    let entityType = 'unknown';
    let entityId = null;
    let action = method;

    if (urlParts.length > 0) {
      entityType = urlParts[0].replace(/-/g, '_'); // Convert kebab-case to snake_case
      
      // Try to find entity ID from params or URL
      if (params?.id) {
        entityId = params.id;
      } else if (params) {
        // Look for common ID patterns
        const idKeys = Object.keys(params).filter(key => key.endsWith('Id') || key.endsWith('_id') || key === 'id');
        if (idKeys.length > 0) {
          entityId = params[idKeys[0]];
        }
      }

      // If no ID in params, try to extract from URL
      if (!entityId && urlParts.length > 1) {
        const potentialId = urlParts[1];
        // Check if it looks like a UUID or numeric ID
        if (this.isValidId(potentialId)) {
          entityId = potentialId;
        }
      }

      // If creating new entity, try to get ID from response or generate temporary
      if (!entityId && method === 'POST' && body) {
        entityId = body.id || body.uuid || 'new_entity';
      }
    }

    // Map HTTP methods to more descriptive actions
    const actionMap: Record<string, string> = {
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };

    action = actionMap[method] || method;

    // Add specific action context based on URL patterns
    if (url.includes('/approve')) action = 'APPROVE';
    else if (url.includes('/reject')) action = 'REJECT';
    else if (url.includes('/authorize')) action = 'AUTHORIZE';
    else if (url.includes('/cancel')) action = 'CANCEL';
    else if (url.includes('/activate')) action = 'ACTIVATE';
    else if (url.includes('/deactivate')) action = 'DEACTIVATE';
    else if (url.includes('/login')) action = 'LOGIN';
    else if (url.includes('/logout')) action = 'LOGOUT';

    return { action, entityType, entityId };
  }

  private isValidId(value: string): boolean {
    // Check for UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Check for numeric ID
    const numericPattern = /^\d+$/;
    
    return uuidPattern.test(value) || numericPattern.test(value);
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'credential',
      'authorization', 'auth', 'session', 'cookie'
    ];

    const sanitized = { ...data };

    // Remove sensitive fields
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
} 