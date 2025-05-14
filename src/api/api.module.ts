import { Module } from '@nestjs/common';
import { HealthController } from './controllers/Health/health.controller';
import { AuthModule } from './v1/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
})
export class ApiModule {}
