import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderQuotationsController } from './provider-quotations.controller';
import { ProviderQuotationsService } from '../../../application/services/provider-quotations/provider-quotations.service';
import { ProveedorEntity, EspecialidadEntity } from '../../../infrastructure/persistence/postgres/entities/proveedor.entity';
import { MedicalOrderTypeOrmEntity } from '../../../infrastructure/entities/medical-order.typeorm-entity';
import { EffectorRequestEntity } from '../../../infrastructure/entities/effector-request.entity';
import { QuotationAuditEntity, QuotationAuditRecommendationEntity, QuotationAuditRiskFactorEntity } from '../../../entities/quotation-audit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProveedorEntity,
      EspecialidadEntity,
      MedicalOrderTypeOrmEntity,
      EffectorRequestEntity,
      QuotationAuditEntity,
      QuotationAuditRecommendationEntity,
      QuotationAuditRiskFactorEntity
    ])
  ],
  controllers: [ProviderQuotationsController],
  providers: [ProviderQuotationsService],
  exports: [ProviderQuotationsService]
})
export class ProviderQuotationsModule {} 