import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EffectorRequestStateEntity } from './effector-request-state.entity';
import { EffectorRequestItemEntity } from './effector-request-item.entity';
import { EffectorRequestAttachmentEntity } from './effector-request-attachment.entity';

@Entity('effector_requests')
export class EffectorRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  request_id: string;

  @Column('uuid')
  effector_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  request_number: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('uuid')
  state_id: string;

  @Column({ type: 'enum', enum: ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'], default: 'NORMAL' })
  priority: string;

  @Column({ type: 'date', nullable: true })
  delivery_date: Date;

  @Column({ type: 'text', nullable: true })
  delivery_address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_person: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_estimated_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid', { nullable: true })
  created_by: string;

  @Column('uuid', { nullable: true })
  updated_by: string;

  // Relations
  @ManyToOne(() => EffectorRequestStateEntity)
  @JoinColumn({ name: 'state_id' })
  state: EffectorRequestStateEntity;

  @OneToMany(() => EffectorRequestItemEntity, item => item.request)
  items: EffectorRequestItemEntity[];

  @OneToMany(() => EffectorRequestAttachmentEntity, attachment => attachment.request)
  attachments: EffectorRequestAttachmentEntity[];
} 