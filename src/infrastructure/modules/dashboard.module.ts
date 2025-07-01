import { Module } from '@nestjs/common';
import { DashboardController } from '../../api/v1/dashboard/dashboard.controller';
import { DashboardService } from '../../application/services/dashboard/dashboard.service';
import { AdminUserModule } from '../../api/v1/admin/admin-user.module';
import { MedicalOrdersModule } from '../../api/v1/medical-orders/medical-orders.module';
import { ActivityModule } from './activity.module';
import { EffectorRequestModule } from '../../api/v1/effector-requests/effector-request.module';

@Module({
  imports: [
    AdminUserModule,
    MedicalOrdersModule,
    ActivityModule,
    EffectorRequestModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {} 