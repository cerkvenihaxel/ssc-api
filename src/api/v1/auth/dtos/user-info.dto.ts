import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ description: 'ID del usuario' })
  userId: string;

  @ApiProperty({ description: 'Email del usuario' })
  email: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  nombre: string;

  @ApiProperty({ description: 'Rol del usuario' })
  role: {
    id: number;
    name: string;
    description: string;
  };

  @ApiProperty({ description: 'Estado del usuario' })
  status: string;

  @ApiProperty({ description: 'Permisos del usuario' })
  permissions: string[];

  @ApiProperty({ description: 'Ruta de redirección por defecto' })
  defaultRoute: string;

  @ApiProperty({ description: 'Rutas disponibles para este rol' })
  availableRoutes: RouteInfo[];

  @ApiProperty({ description: 'Último login' })
  lastLogin?: Date;

  @ApiProperty({ description: 'Email verificado' })
  emailVerified: boolean;
}

export class RouteInfo {
  @ApiProperty({ description: 'Ruta' })
  path: string;

  @ApiProperty({ description: 'Título de la ruta' })
  title: string;

  @ApiProperty({ description: 'Icono' })
  icon?: string;

  @ApiProperty({ description: 'Descripción' })
  description?: string;

  @ApiProperty({ description: 'Orden en el menú' })
  order: number;

  @ApiProperty({ description: 'Subrutas' })
  children?: RouteInfo[];
}

export class LoginSuccessDto {
  @ApiProperty({ description: 'Token de acceso JWT' })
  accessToken: string;

  @ApiProperty({ description: 'ID de sesión' })
  sessionId: string;

  @ApiProperty({ description: 'Información del usuario' })
  user: UserInfoDto;

  @ApiProperty({ description: 'Mensaje de éxito' })
  message: string;

  @ApiProperty({ description: 'Tiempo de expiración del token en segundos' })
  expiresIn: number;
} 