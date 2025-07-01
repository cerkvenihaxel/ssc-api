import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Address } from '@domain/entities/address.entity';
import { Affiliate } from '@domain/entities/affiliate.entity';
import { ProveedorEntity, EspecialidadEntity } from '../persistence/postgres/entities/proveedor.entity';
import { Usuario } from '../persistence/postgres/entities/usuario.entity';
import { ArticuloEntity } from '../persistence/postgres/entities/articulo.entity';
import { ArticuloDetalleEntity } from '../persistence/postgres/entities/articulo-detalle.entity';
import { GrupoArticuloEntity } from '../persistence/postgres/entities/grupo-articulo.entity';
import { 
  MedicalOrderTypeOrmEntity, 
  MedicalOrderItemTypeOrmEntity,
  MedicalOrderAttachmentTypeOrmEntity,
  MedicalOrderAuthorizationTypeOrmEntity,
  MedicalCategoryTypeOrmEntity,
  UrgencyTypeTypeOrmEntity,
  MedicalOrderStateTypeOrmEntity
} from '../entities/medical-order.typeorm-entity';
import { AiMedicalOrderAnalysis } from '../../entities/ai-medical-order-analysis.entity';
import { AiItemAnalysis } from '../../entities/ai-item-analysis.entity';
import { AiRiskFactor } from '../../entities/ai-risk-factor.entity';
import { AiRecommendation } from '../../entities/ai-recommendation.entity';
import { AiCorrectionSuggestion } from '../../entities/ai-correction-suggestion.entity';
// Effector Request entities
import { EffectorRequestEntity } from '../entities/effector-request.entity';
import { EffectorRequestItemEntity } from '../entities/effector-request-item.entity';
import { EffectorRequestAttachmentEntity } from '../entities/effector-request-attachment.entity';
import { EffectorRequestStateEntity } from '../entities/effector-request-state.entity';
// Activity Log entity
import { ActivityLogEntity } from '../entities/activity-log.entity';
import { join } from 'path';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'ssc_db',
  entities: [
    Address, 
    Affiliate, 
    ProveedorEntity, 
    EspecialidadEntity, 
    Usuario,
    ArticuloEntity,
    ArticuloDetalleEntity,
    GrupoArticuloEntity,
    // Medical Orders entities
    MedicalOrderTypeOrmEntity,
    MedicalOrderItemTypeOrmEntity,
    MedicalOrderAttachmentTypeOrmEntity,
    MedicalOrderAuthorizationTypeOrmEntity,
    MedicalCategoryTypeOrmEntity,
    UrgencyTypeTypeOrmEntity,
    MedicalOrderStateTypeOrmEntity,
    // AI Analysis entities
    AiMedicalOrderAnalysis,
    AiItemAnalysis,
    AiRiskFactor,
    AiRecommendation,
    AiCorrectionSuggestion,
    // Effector Request entities
    EffectorRequestEntity,
    EffectorRequestItemEntity,
    EffectorRequestAttachmentEntity,
    EffectorRequestStateEntity,
    // Activity Log entity
    ActivityLogEntity
  ],
  migrations: [join(__dirname, '../persistence/postgres/migrations/*.{ts,js}')],
  synchronize: false, // Disabled to prevent automatic schema changes
  logging: false, // Disabled to reduce console noise
  migrationsRun: false, // Disabled - use manual script.sql instead
  dropSchema: false, // Prevent accidental schema drops
}; 