import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ApplicationModule } from './application/application.module';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [
    ApiModule,
    ApplicationModule,
    DomainModule,
    InfrastructureModule
  ],
})
export class AppModule {}
