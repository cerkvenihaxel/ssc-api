import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProviderQuotationEntity } from './provider-quotation.entity';
import { MedicalOrderTypeOrmEntity } from './medical-order.typeorm-entity';

@Entity('audit_requests')
export class AuditRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  audit_request_id: string;

  @Column('uuid')
  quotation_id: string;

  @Column('uuid')
  medical_order_id: string;

  @Column('uuid')
  provider_id: string;

  @Column({ type: 'varchar', length: 50 })
  audit_status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';

  @Column({ type: 'text', nullable: true })
  auditor_notes: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  original_order_cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  quoted_cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approved_cost: number;

  @Column({ type: 'jsonb', nullable: true })
  item_comparison: any; // Comparación detallada de items

  @Column({ type: 'jsonb', nullable: true })
  audit_criteria: any; // Criterios de auditoría aplicados

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  audit_type: 'manual' | 'ai' | 'hybrid';

  @Column('uuid', { nullable: true })
  auditor_id: string;

  @Column({ type: 'timestamp', nullable: true })
  audited_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid', { nullable: true })
  created_by: string;

  @Column('uuid', { nullable: true })
  updated_by: string;

  // Relations
  @ManyToOne(() => ProviderQuotationEntity)
  @JoinColumn({ name: 'quotation_id' })
  quotation: ProviderQuotationEntity;

  @ManyToOne(() => MedicalOrderTypeOrmEntity)
  @JoinColumn({ name: 'medical_order_id' })
  medicalOrder: MedicalOrderTypeOrmEntity;
} 