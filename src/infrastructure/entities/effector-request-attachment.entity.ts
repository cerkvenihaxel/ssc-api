import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EffectorRequestEntity } from './effector-request.entity';

@Entity('effector_request_attachments')
export class EffectorRequestAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  attachment_id: string;

  @Column('uuid')
  request_id: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'varchar', length: 50 })
  file_type: string;

  @Column({ type: 'integer' })
  file_size: number;

  @Column('uuid', { nullable: true })
  uploaded_by: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploaded_at: Date;

  // Relations
  @ManyToOne(() => EffectorRequestEntity, request => request.attachments)
  @JoinColumn({ name: 'request_id' })
  request: EffectorRequestEntity;
} 