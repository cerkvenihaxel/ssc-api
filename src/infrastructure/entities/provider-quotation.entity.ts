import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('provider_quotations')
export class ProviderQuotationEntity {
  @PrimaryGeneratedColumn('uuid')
  quotation_id: string;

  @Column('uuid')
  request_id: string;

  @Column('uuid')
  provider_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  quotation_number: string;

  @Column('uuid')
  state_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_amount: number;

  @Column({ type: 'integer', nullable: true })
  delivery_time_days: number;

  @Column({ type: 'text', nullable: true })
  delivery_terms: string;

  @Column({ type: 'text', nullable: true })
  payment_terms: string;

  @Column({ type: 'text', nullable: true })
  warranty_terms: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'date', nullable: true })
  valid_until: Date;

  // Estado de la cotización
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'sent' | 'approved' | 'rejected' | 'completed';

  // Nuevo campo para auditoría
  @Column({ type: 'boolean', default: false })
  available_for_audit: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid', { nullable: true })
  created_by: string;

  @Column('uuid', { nullable: true })
  updated_by: string;

  // Relations
  @OneToMany(() => ProviderQuotationItemEntity, item => item.quotation)
  items: ProviderQuotationItemEntity[];

  @OneToMany(() => ProviderQuotationAttachmentEntity, attachment => attachment.quotation)
  attachments: ProviderQuotationAttachmentEntity[];
}

@Entity('provider_quotation_items')
export class ProviderQuotationItemEntity {
  @PrimaryGeneratedColumn('uuid')
  quotation_item_id: string;

  @Column('uuid')
  quotation_id: string;

  @Column('uuid')
  request_item_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_price: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer', nullable: true })
  delivery_time_days: number;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => ProviderQuotationEntity)
  @JoinColumn({ name: 'quotation_id' })
  quotation: ProviderQuotationEntity;
}

@Entity('provider_quotation_attachments')
export class ProviderQuotationAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  attachment_id: string;

  @Column('uuid')
  quotation_id: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'varchar', length: 10 })
  file_type: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @Column('uuid', { nullable: true })
  uploaded_by: string;

  @CreateDateColumn()
  uploaded_at: Date;

  // Relations
  @ManyToOne(() => ProviderQuotationEntity)
  @JoinColumn({ name: 'quotation_id' })
  quotation: ProviderQuotationEntity;
} 