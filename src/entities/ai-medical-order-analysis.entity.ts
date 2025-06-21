import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { MedicalOrderTypeOrmEntity } from '../infrastructure/entities/medical-order.typeorm-entity';
import { AiItemAnalysis } from './ai-item-analysis.entity';
import { AiRiskFactor } from './ai-risk-factor.entity';
import { AiRecommendation } from './ai-recommendation.entity';
import { AiCorrectionSuggestion } from './ai-correction-suggestion.entity';

export type AnalysisDecision = 'approved' | 'rejected' | 'partial' | 'requires_review';
export type AnalysisType = 'automatic' | 'fallback' | 'manual_review';

@Entity('ai_medical_order_analyses')
export class AiMedicalOrderAnalysis {
  @PrimaryGeneratedColumn('uuid', { name: 'analysis_id' })
  analysisId: string;

  @Column({ name: 'medical_order_id', type: 'uuid' })
  medicalOrderId: string;

  // Análisis General
  @Column({ 
    name: 'overall_decision', 
    type: 'varchar', 
    length: 20,
    enum: ['approved', 'rejected', 'partial', 'requires_review']
  })
  overallDecision: AnalysisDecision;

  @Column({ 
    name: 'confidence_score', 
    type: 'decimal', 
    precision: 3, 
    scale: 2 
  })
  confidenceScore: number;

  @Column({ type: 'text' })
  reasoning: string;

  // Metadatos del Análisis
  @Column({ 
    name: 'ai_model_version', 
    type: 'varchar', 
    length: 50, 
    default: 'gpt-4' 
  })
  aiModelVersion: string;

  @Column({ 
    name: 'analysis_type', 
    type: 'varchar', 
    length: 20, 
    default: 'automatic',
    enum: ['automatic', 'fallback', 'manual_review']
  })
  analysisType: AnalysisType;

  @Column({ name: 'processing_time_ms', type: 'int', nullable: true })
  processingTimeMs?: number;

  // Costos y Tokens
  @Column({ name: 'tokens_used', type: 'int', nullable: true })
  tokensUsed?: number;

  @Column({ 
    name: 'estimated_cost', 
    type: 'decimal', 
    precision: 10, 
    scale: 4, 
    nullable: true 
  })
  estimatedCost?: number;

  // Información Contextual
  @Column({ name: 'medical_specialty', type: 'varchar', length: 100, nullable: true })
  medicalSpecialty?: string;

  @Column({ name: 'urgency_level', type: 'int', nullable: true })
  urgencyLevel?: number;

  @Column({ name: 'total_items_analyzed', type: 'int' })
  totalItemsAnalyzed: number;

  // Timestamps
  @Column({ 
    name: 'analyzed_at', 
    type: 'timestamp with time zone', 
    default: () => 'NOW()' 
  })
  analyzedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => MedicalOrderTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_order_id' })
  medicalOrder: MedicalOrderTypeOrmEntity;

  @OneToMany(() => AiItemAnalysis, (itemAnalysis) => itemAnalysis.analysis)
  itemAnalyses: AiItemAnalysis[];

  @OneToMany(() => AiRiskFactor, (riskFactor) => riskFactor.analysis)
  riskFactors: AiRiskFactor[];

  @OneToMany(() => AiRecommendation, (recommendation) => recommendation.analysis)
  recommendations: AiRecommendation[];

  @OneToMany(() => AiCorrectionSuggestion, (suggestion) => suggestion.originalAnalysis)
  correctionSuggestions: AiCorrectionSuggestion[];
} 