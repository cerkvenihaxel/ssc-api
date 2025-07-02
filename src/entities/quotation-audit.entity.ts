import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('quotation_audits')
export class QuotationAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  audit_id: string;

  @Column({ type: 'uuid' })
  quotation_id: string;

  @Column({ type: 'uuid' })
  audited_by: string; // ID del auditor o 'AI' para auditoría automática

  @Column({ type: 'varchar', length: 20 })
  audit_type: 'manual' | 'automatic'; // Tipo de auditoría

  @Column({ type: 'varchar', length: 20 })
  decision: 'approved' | 'rejected' | 'partial' | 'requires_review';

  @Column({ type: 'text', nullable: true })
  audit_notes: string; // Notas del auditor

  @Column({ type: 'jsonb', nullable: true })
  ai_analysis_result: any; // Resultado del análisis de IA

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  ai_confidence_score: number; // Puntuación de confianza de IA (0-1)

  @Column({ type: 'text', nullable: true })
  ai_reasoning: string; // Razonamiento de la IA

  @Column({ type: 'jsonb', nullable: true })
  approved_items: any; // Items aprobados en caso de auditoría parcial

  @Column({ type: 'jsonb', nullable: true })
  rejected_items: any; // Items rechazados con razones

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  approved_amount: number; // Monto total aprobado

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  original_amount: number; // Monto original cotizado

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('quotation_audit_recommendations')
export class QuotationAuditRecommendationEntity {
  @PrimaryGeneratedColumn('uuid')
  recommendation_id: string;

  @Column({ type: 'uuid' })
  audit_id: string;

  @Column({ type: 'varchar', length: 50 })
  recommendation_type: 'price_review' | 'quantity_adjustment' | 'alternative_supplier' | 'contract_negotiation' | 'quality_verification';

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  priority: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'boolean', default: false })
  implemented: boolean;

  @Column({ type: 'text', nullable: true })
  implementation_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('quotation_audit_risk_factors')
export class QuotationAuditRiskFactorEntity {
  @PrimaryGeneratedColumn('uuid')
  risk_factor_id: string;

  @Column({ type: 'uuid' })
  audit_id: string;

  @Column({ type: 'varchar', length: 50 })
  risk_type: 'price_anomaly' | 'delivery_concern' | 'quality_risk' | 'supplier_reliability' | 'market_volatility';

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  probability: number; // Probabilidad de ocurrencia (0-100)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  potential_impact: number; // Impacto económico potencial

  @Column({ type: 'text', nullable: true })
  mitigation_strategy: string;

  @CreateDateColumn()
  created_at: Date;
} 