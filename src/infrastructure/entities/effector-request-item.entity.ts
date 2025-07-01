import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EffectorRequestEntity } from './effector-request.entity';

@Entity('effector_request_items')
export class EffectorRequestItemEntity {
  @PrimaryGeneratedColumn('uuid')
  item_id: string;

  @Column('uuid')
  request_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  article_code: string;

  @Column({ type: 'varchar', length: 255 })
  article_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit_measure: string;

  @Column({ type: 'date', nullable: true })
  expiration_date: Date;

  @Column({ type: 'text', nullable: true })
  technical_specifications: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated_unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimated_total_price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => EffectorRequestEntity, request => request.items)
  @JoinColumn({ name: 'request_id' })
  request: EffectorRequestEntity;
} 