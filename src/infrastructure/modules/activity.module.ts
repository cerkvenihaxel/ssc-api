import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogEntity } from '../entities/activity-log.entity';
import { ActivityLogRepositoryImpl } from '../repositories/activity-log.repository.impl';
import { ActivityLogService } from '../../application/services/activity/activity-log.service';
import { ActivitiesController } from '../../api/v1/activities/activities.controller';
import { AdminUserModule } from '../../api/v1/admin/admin-user.module';
import { AuthModule } from '../../api/v1/auth/auth.module';
import { JwtAuthGuard } from '../../api/guards/jwt-auth.guard';
import { AdminGuard } from '../../api/guards/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLogEntity]),
    AdminUserModule, // Para el AdminGuard
    AuthModule, // Para el JwtAuthGuard y estrategias
  ],
  controllers: [ActivitiesController],
  providers: [
    ActivityLogService,
    {
      provide: 'ActivityLogRepository',
      useClass: ActivityLogRepositoryImpl,
    },
    JwtAuthGuard,
    AdminGuard,
  ],
  exports: [
    ActivityLogService,
    'ActivityLogRepository',
  ],
})
export class ActivityModule {} 