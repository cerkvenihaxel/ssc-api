import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalOrdersController } from './medical-orders.controller';
import { MedicalOrdersService } from '../../../application/services/medical-orders/medical-orders.service';
import { OpenAIAuthorizationService } from '../../../infrastructure/services/openai-authorization.service';
import { AiAnalysisPersistenceService } from '../../../application/services/medical-orders/ai-analysis-persistence.service';
import { 
  MedicalOrderTypeOrmEntity, 
  MedicalOrderItemTypeOrmEntity
} from '../../../infrastructure/entities/medical-order.typeorm-entity';
import { AiMedicalOrderAnalysis } from '../../../entities/ai-medical-order-analysis.entity';
import { AiItemAnalysis } from '../../../entities/ai-item-analysis.entity';
import { AiRiskFactor } from '../../../entities/ai-risk-factor.entity';
import { AiRecommendation } from '../../../entities/ai-recommendation.entity';
import { AiCorrectionSuggestion } from '../../../entities/ai-correction-suggestion.entity';
import { PostgresAfiliadoRepository } from '../../../infrastructure/repositories/afiliado/afiliado.repository';
import { Pool } from 'pg';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalOrderTypeOrmEntity,
      MedicalOrderItemTypeOrmEntity,
      // AI Analysis entities
      AiMedicalOrderAnalysis,
      AiItemAnalysis,
      AiRiskFactor,
      AiRecommendation,
      AiCorrectionSuggestion
    ])
  ],
  controllers: [MedicalOrdersController],
  providers: [
    MedicalOrdersService,
    OpenAIAuthorizationService,
    AiAnalysisPersistenceService,
    {
      provide: 'IAfiliadoRepository',
      useClass: PostgresAfiliadoRepository,
    },
    {
      provide: Pool,
      useFactory: () => {
        return new Pool({
          user: process.env.DB_USER || 'admin',
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME || 'ssc_db',
          password: process.env.DB_PASSWORD || 'admin',
          port: parseInt(process.env.DB_PORT || '5433'),
        });
      },
    },
  ],
  exports: [
    MedicalOrdersService,
    OpenAIAuthorizationService
  ]
})
export class MedicalOrdersModule {} 