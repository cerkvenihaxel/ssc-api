import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AiMedicalOrderAnalysis } from './ai-medical-order-analysis.entity';
import { MedicalOrderItemTypeOrmEntity } from '../infrastructure/entities/medical-order.typeorm-entity';

export type ItemDecision = 'approved' | 'rejected' | 'partial' | 'requires_review';

@Entity('ai_item_analyses')
export class AiItemAnalysis {
  @PrimaryGeneratedColumn('uuid', { name: 'item_analysis_id' })
  itemAnalysisId: string;

  @Column({ name: 'analysis_id', type: 'uuid' })
  analysisId: string;

  @Column({ name: 'medical_order_item_id', type: 'uuid' })
  medicalOrderItemId: string;

  // Decisión por Item
  @Column({ 
    name: 'item_decision', 
    type: 'varchar', 
    length: 20,
    enum: ['approved', 'rejected', 'partial', 'requires_review']
  })
  itemDecision: ItemDecision;

  @Column({ name: 'requested_quantity', type: 'int' })
  requestedQuantity: number;

  @Column({ name: 'approved_quantity', type: 'int', nullable: true })
  approvedQuantity?: number;

  @Column({ name: 'ai_reasoning', type: 'text', nullable: true })
  aiReasoning?: string;

  @Column({ name: 'rejection_reasoning', type: 'text', nullable: true })
  rejectionReasoning?: string;

  // Análisis Médico Específico
  @Column({ 
    name: 'medical_appropriateness_score', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    nullable: true 
  })
  medicalAppropriatenessScore?: number;

  @Column({ 
    name: 'dosage_appropriateness_score', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    nullable: true 
  })
  dosageAppropriatenessScore?: number;

  @Column({ 
    name: 'cost_effectiveness_score', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    nullable: true 
  })
  costEffectivenessScore?: number;

  // Flags de Riesgo
  @Column({ name: 'has_drug_interaction', type: 'boolean', default: false })
  hasDrugInteraction: boolean;

  @Column({ name: 'has_dosage_concern', type: 'boolean', default: false })
  hasDosageConcern: boolean;

  @Column({ name: 'has_medical_inconsistency', type: 'boolean', default: false })
  hasMedicalInconsistency: boolean;

  @Column({ name: 'has_cost_concern', type: 'boolean', default: false })
  hasCostConcern: boolean;

  // Recomendaciones Específicas
  @Column({ name: 'alternative_suggestions', type: 'text', nullable: true })
  alternativeSuggestions?: string;

  @Column({ name: 'dosage_recommendations', type: 'text', nullable: true })
  dosageRecommendations?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => AiMedicalOrderAnalysis, (analysis) => analysis.itemAnalyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'analysis_id' })
  analysis: AiMedicalOrderAnalysis;

  @ManyToOne(() => MedicalOrderItemTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_order_item_id' })
  medicalOrderItem: MedicalOrderItemTypeOrmEntity;
} 