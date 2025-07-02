import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medical_orders')
export class MedicalOrderTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  order_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  order_number: string;

  // Información del solicitante
  @Column({ type: 'uuid' })
  requester_id: string;

  @Column({ type: 'varchar', length: 20 })
  requester_type: 'admin' | 'doctor' | 'auditor';

  // Información del beneficiario
  @Column({ type: 'uuid' })
  affiliate_id: string;

  @Column({ type: 'uuid', nullable: true })
  healthcare_provider_id: string;

  // Estado del pedido
  @Column({ type: 'integer' })
  state_id: number;

  @Column({ type: 'integer' })
  urgency_id: number;

  // NUEVO: Campo para controlar disponibilidad para cotización
  @Column({ type: 'boolean', default: false })
  available_for_quotation: boolean;

  // NUEVO: Especialidades asociadas al pedido
  @Column({ type: 'jsonb', nullable: true })
  specialties: string[]; // Array de IDs de especialidades

  // Información del pedido
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  medical_justification: string;

  // Información médica adicional
  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment_plan: string;

  @Column({ type: 'integer', nullable: true })
  estimated_duration_days: number;

  // Archivos adjuntos
  @Column({ type: 'boolean', default: false })
  has_attachments: boolean;

  // Información de seguimiento
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimated_cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approved_cost: number;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  // Autorización
  @Column({ type: 'varchar', length: 20, nullable: true })
  authorization_type: 'manual' | 'automatic' | 'hybrid';

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  authorization_status: 'pending' | 'approved' | 'rejected' | 'partial';

  @Column({ type: 'uuid', nullable: true })
  authorized_by: string;

  @Column({ type: 'timestamp', nullable: true })
  authorized_at: Date;

  @Column({ type: 'text', nullable: true })
  authorization_notes: string;

  // AI Authorization
  @Column({ type: 'jsonb', nullable: true })
  ai_analysis_result: any;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  ai_confidence_score: number;

  @Column({ type: 'timestamp', nullable: true })
  ai_analyzed_at: Date;

  // Metadatos
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  // Relaciones (OneToMany solamente) - temporalmente comentadas para evitar dependencias circulares
  // @OneToMany(() => MedicalOrderItemTypeOrmEntity, item => item.order_id, { cascade: true })
  items?: MedicalOrderItemTypeOrmEntity[];

  // @OneToMany(() => MedicalOrderAttachmentTypeOrmEntity, attachment => attachment.order_id, { cascade: true })
  // attachments: MedicalOrderAttachmentTypeOrmEntity[];

  // @OneToMany(() => MedicalOrderAuthorizationTypeOrmEntity, authorization => authorization.order_id, { cascade: true })
  // authorizations: MedicalOrderAuthorizationTypeOrmEntity[];
}

@Entity('medical_order_items')
export class MedicalOrderItemTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  item_id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  // Información del artículo
  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'varchar', length: 20 })
  item_type: 'medication' | 'equipment' | 'supply';

  @Column({ type: 'varchar', length: 200 })
  item_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  item_code: string;

  @Column({ type: 'text', nullable: true })
  item_description: string;

  // Cantidad y especificaciones
  @Column({ type: 'integer' })
  requested_quantity: number;

  @Column({ type: 'integer', nullable: true })
  approved_quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit_of_measure: string;

  // Información adicional
  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  presentation: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  concentration: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  administration_route: string;

  // Justificación específica del item
  @Column({ type: 'text', nullable: true })
  medical_justification: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated_unit_cost: number;

  // Estado del item
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  item_status: 'pending' | 'approved' | 'rejected' | 'partial';

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  // Metadatos
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('medical_order_attachments')
export class MedicalOrderAttachmentTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  attachment_id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  // Información del archivo
  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'integer' })
  file_size: number;

  @Column({ type: 'varchar', length: 100 })
  file_type: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  // Metadatos
  @Column({ type: 'uuid' })
  uploaded_by: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column({ type: 'text', nullable: true })
  description: string;
}

@Entity('medical_order_authorizations')
export class MedicalOrderAuthorizationTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  authorization_id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  // Información de la autorización
  @Column({ type: 'varchar', length: 20 })
  authorization_type: 'manual' | 'automatic';

  @Column({ type: 'varchar', length: 20 })
  decision: 'approved' | 'rejected' | 'partial';

  // Información del autorizador (si es manual)
  @Column({ type: 'uuid', nullable: true })
  authorized_by: string;

  @Column({ type: 'text', nullable: true })
  authorization_notes: string;

  // Información de AI (si es automática)
  @Column({ type: 'varchar', length: 50, nullable: true })
  ai_model_version: string;

  @Column({ type: 'jsonb', nullable: true })
  ai_analysis_result: any;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  ai_confidence_score: number;

  @Column({ type: 'text', nullable: true })
  ai_reasoning: string;

  // Detalles específicos
  @Column({ type: 'jsonb', nullable: true })
  approved_items: any;

  @Column({ type: 'jsonb', nullable: true })
  rejected_items: any;

  // Metadatos
  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;
}

@Entity('medical_categories')
export class MedicalCategoryTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  category_id: string;

  @Column({ type: 'varchar', length: 100 })
  category_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parent_category_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('urgency_types')
export class UrgencyTypeTypeOrmEntity {
  @PrimaryGeneratedColumn()
  urgency_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  urgency_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer' })
  priority_level: number;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color_code: string;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('medical_order_states')
export class MedicalOrderStateTypeOrmEntity {
  @PrimaryGeneratedColumn()
  state_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  state_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_final: boolean;

  @CreateDateColumn()
  created_at: Date;
} 