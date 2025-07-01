import { Module } from '@nestjs/common';
import { ActivityModule } from './modules/activity.module';
import { DashboardModule } from './modules/dashboard.module';

@Module({
  imports: [ActivityModule, DashboardModule],
  exports: [ActivityModule, DashboardModule],
})
export class InfrastructureModule {}
