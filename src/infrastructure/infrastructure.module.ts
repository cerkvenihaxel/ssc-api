import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from './modules/activity.module';
import { DashboardModule } from './modules/dashboard.module';
import {
  ProviderQuotationEntity,
  ProviderQuotationItemEntity,
  ProviderQuotationAttachmentEntity,
} from './entities/provider-quotation.entity';
import { AuditRequestEntity } from './entities/audit-request.entity';
import {
  MedicalOrderTypeOrmEntity,
  MedicalOrderItemTypeOrmEntity,
  MedicalCategoryTypeOrmEntity,
  UrgencyTypeTypeOrmEntity,
} from './entities/medical-order.typeorm-entity';
import { ProveedorEntity } from './persistence/postgres/entities/proveedor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProviderQuotationEntity,
      ProviderQuotationItemEntity,
      ProviderQuotationAttachmentEntity,
      AuditRequestEntity,
      MedicalOrderTypeOrmEntity,
      MedicalOrderItemTypeOrmEntity,
      MedicalCategoryTypeOrmEntity,
      UrgencyTypeTypeOrmEntity,
      ProveedorEntity,
    ]),
    ActivityModule,
    DashboardModule,
  ],
  exports: [TypeOrmModule, ActivityModule, DashboardModule],
})
export class InfrastructureModule {}
