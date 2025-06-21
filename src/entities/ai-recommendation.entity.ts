import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AiMedicalOrderAnalysis } from './ai-medical-order-analysis.entity';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'implemented';

@Entity('ai_recommendations')
export class AiRecommendation {
  @PrimaryGeneratedColumn('uuid', { name: 'recommendation_id' })
  recommendationId: string;

  @Column({ name: 'analysis_id', type: 'uuid' })
  analysisId: string;

  @Column({ name: 'recommendation_type', type: 'varchar', length: 50 })
  recommendationType: string;

  @Column({ 
    name: 'priority', 
    type: 'varchar', 
    length: 20,
    enum: ['low', 'medium', 'high', 'urgent']
  })
  priority: RecommendationPriority;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  // Acción Recomendada
  @Column({ name: 'suggested_action', type: 'varchar', length: 100, nullable: true })
  suggestedAction?: string;

  @Column({ name: 'target_item_ids', type: 'text', array: true, nullable: true })
  targetItemIds?: string[];

  // Estado de la Recomendación
  @Column({ 
    name: 'status', 
    type: 'varchar', 
    length: 20, 
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected', 'implemented']
  })
  status: RecommendationStatus;

  @Column({ name: 'implemented_by', type: 'uuid', nullable: true })
  implementedBy?: string;

  @Column({ name: 'implemented_at', type: 'timestamp with time zone', nullable: true })
  implementedAt?: Date;

  @Column({ name: 'implementation_notes', type: 'text', nullable: true })
  implementationNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => AiMedicalOrderAnalysis, (analysis) => analysis.recommendations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'analysis_id' })
  analysis: AiMedicalOrderAnalysis;
} 