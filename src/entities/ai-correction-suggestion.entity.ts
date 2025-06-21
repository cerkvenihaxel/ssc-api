import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AiMedicalOrderAnalysis } from './ai-medical-order-analysis.entity';
import { MedicalOrderTypeOrmEntity } from '../infrastructure/entities/medical-order.typeorm-entity';

export type CorrectionStatus = 'pending' | 'accepted' | 'rejected' | 'applied';
export type ClinicalEvidenceLevel = 'low' | 'moderate' | 'high' | 'expert_consensus';

@Entity('ai_correction_suggestions')
export class AiCorrectionSuggestion {
  @PrimaryGeneratedColumn('uuid', { name: 'suggestion_id' })
  suggestionId: string;

  @Column({ name: 'original_analysis_id', type: 'uuid' })
  originalAnalysisId: string;

  @Column({ name: 'medical_order_id', type: 'uuid' })
  medicalOrderId: string;

  // Tipo de Corrección Sugerida
  @Column({ name: 'correction_type', type: 'varchar', length: 50 })
  correctionType: string;

  @Column({ name: 'target_field', type: 'varchar', length: 100, nullable: true })
  targetField?: string;

  // Valores Sugeridos
  @Column({ name: 'current_value', type: 'text', nullable: true })
  currentValue?: string;

  @Column({ name: 'suggested_value', type: 'text', nullable: true })
  suggestedValue?: string;

  @Column({ name: 'correction_reasoning', type: 'text' })
  correctionReasoning: string;

  // Metadatos
  @Column({ 
    name: 'confidence_score', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    nullable: true 
  })
  confidenceScore?: number;

  @Column({ 
    name: 'clinical_evidence_level', 
    type: 'varchar', 
    length: 20, 
    nullable: true,
    enum: ['low', 'moderate', 'high', 'expert_consensus']
  })
  clinicalEvidenceLevel?: ClinicalEvidenceLevel;

  // Estado de la Sugerencia
  @Column({ 
    name: 'status', 
    type: 'varchar', 
    length: 20, 
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected', 'applied']
  })
  status: CorrectionStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'reviewed_at', type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => AiMedicalOrderAnalysis, (analysis) => analysis.correctionSuggestions)
  @JoinColumn({ name: 'original_analysis_id' })
  originalAnalysis: AiMedicalOrderAnalysis;

  @ManyToOne(() => MedicalOrderTypeOrmEntity)
  @JoinColumn({ name: 'medical_order_id' })
  medicalOrder: MedicalOrderTypeOrmEntity;
} 