import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditorController } from './auditor.controller';
import { AuditorService } from '../../../application/services/auditor/auditor.service';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { Affiliate } from '../../../domain/entities/affiliate.entity';

@Module({
  imports: [InfrastructureModule, TypeOrmModule.forFeature([Affiliate])],
  controllers: [AuditorController],
  providers: [AuditorService],
  exports: [AuditorService],
})
export class AuditorModule {} 