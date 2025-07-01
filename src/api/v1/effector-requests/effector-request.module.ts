import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EffectorRequestController } from './effector-request.controller';
import { EffectorRequestService } from '../../../application/services/effector-request/effector-request.service';
import { EffectorAIAnalysisService } from '../../../application/services/effector-request/effector-ai-analysis.service';
import { OpenAIAuthorizationService } from '../../../infrastructure/services/openai-authorization.service';
import { EffectorRequestEntity } from '../../../infrastructure/entities/effector-request.entity';
import { EffectorRequestItemEntity } from '../../../infrastructure/entities/effector-request-item.entity';
import { EffectorRequestAttachmentEntity } from '../../../infrastructure/entities/effector-request-attachment.entity';
import { EffectorRequestStateEntity } from '../../../infrastructure/entities/effector-request-state.entity';
import { EffectorRequestRepositoryImpl } from '../../../infrastructure/repositories/effector-request/effector-request.repository.impl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EffectorRequestEntity,
      EffectorRequestItemEntity,
      EffectorRequestAttachmentEntity,
      EffectorRequestStateEntity,
    ]),
  ],
  controllers: [EffectorRequestController],
  providers: [
    EffectorRequestService,
    EffectorAIAnalysisService,
    OpenAIAuthorizationService,
    {
      provide: 'EffectorRequestRepository',
      useClass: EffectorRequestRepositoryImpl,
    },
    {
      provide: 'OpenAIAuthorizationService',
      useClass: OpenAIAuthorizationService,
    },
  ],
  exports: [EffectorRequestService],
})
export class EffectorRequestModule {} 