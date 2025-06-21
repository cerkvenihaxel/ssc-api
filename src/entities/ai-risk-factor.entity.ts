import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AiMedicalOrderAnalysis } from './ai-medical-order-analysis.entity';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ClinicalSignificance = 'minor' | 'moderate' | 'major' | 'contraindicated';

@Entity('ai_risk_factors')
export class AiRiskFactor {
  @PrimaryGeneratedColumn('uuid', { name: 'risk_factor_id' })
  riskFactorId: string;

  @Column({ name: 'analysis_id', type: 'uuid' })
  analysisId: string;

  @Column({ name: 'risk_type', type: 'varchar', length: 50 })
  riskType: string;

  @Column({ 
    name: 'risk_level', 
    type: 'varchar', 
    length: 20,
    enum: ['low', 'medium', 'high', 'critical']
  })
  riskLevel: RiskLevel;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'affected_items', type: 'text', array: true, nullable: true })
  affectedItems?: string[];

  // Contexto del Riesgo
  @Column({ 
    name: 'clinical_significance', 
    type: 'varchar', 
    length: 20, 
    nullable: true,
    enum: ['minor', 'moderate', 'major', 'contraindicated']
  })
  clinicalSignificance?: ClinicalSignificance;

  @Column({ name: 'requires_specialist_review', type: 'boolean', default: false })
  requiresSpecialistReview: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => AiMedicalOrderAnalysis, (analysis) => analysis.riskFactors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'analysis_id' })
  analysis: AiMedicalOrderAnalysis;
} 