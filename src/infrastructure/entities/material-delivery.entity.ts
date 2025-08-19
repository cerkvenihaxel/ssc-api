import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditRequestEntity } from './audit-request.entity';

@Entity('material_deliveries')
export class MaterialDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  delivery_id: string;

  @Column('uuid')
  audit_request_id: string;

  @Column('uuid')
  provider_id: string;

  @Column({ type: 'varchar', length: 50 })
  delivery_status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';

  @Column({ type: 'date', nullable: true })
  expected_delivery_date: Date;

  @Column({ type: 'date', nullable: true })
  actual_delivery_date: Date;

  @Column({ type: 'text', nullable: true })
  delivery_address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipient_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  courier_company: string;

  @Column({ type: 'jsonb', nullable: true })
  delivered_items: any; // Detalle de items entregados

  @Column({ type: 'jsonb', nullable: true })
  delivery_notes: any; // Notas de entrega

  @Column({ type: 'varchar', length: 100, nullable: true })
  foja_number: string; // Número de foja para prótesis

  @Column({ type: 'integer', nullable: true })
  total_quantity_delivered: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  final_cost: number;

  @Column({ type: 'boolean', default: false })
  quality_check_passed: boolean;

  @Column({ type: 'text', nullable: true })
  quality_check_notes: string;

  @Column({ type: 'boolean', default: false })
  patient_satisfaction: boolean;

  @Column({ type: 'text', nullable: true })
  patient_feedback: string;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column('uuid', { nullable: true })
  completed_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid', { nullable: true })
  created_by: string;

  @Column('uuid', { nullable: true })
  updated_by: string;

  // Relations
  @ManyToOne(() => AuditRequestEntity)
  @JoinColumn({ name: 'audit_request_id' })
  auditRequest: AuditRequestEntity;
} 