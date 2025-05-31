import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminUserService } from '../../application/services/admin/admin-user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private adminUserService: AdminUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Verificar si el usuario tiene permisos de administrador
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler()) || 'ADMIN_ACCESS';
    
    const hasPermission = await this.adminUserService.hasPermission(user.userId, requiredPermission);
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

// Decorator para especificar permisos requeridos
import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (permission: string) => SetMetadata('permission', permission); 