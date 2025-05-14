import { Module } from '@nestjs/common';
import { HealthController } from './controllers/Health/health.controller';
import { AuthModule } from './v1/auth/auth.module';
import { PermisosModule } from './v1/permisos/permisos.module';

@Module({
  imports: [AuthModule, PermisosModule],
  controllers: [HealthController],
})
export class ApiModule {}
