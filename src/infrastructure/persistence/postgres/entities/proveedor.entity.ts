import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('proveedores')
export class ProveedorEntity {
  @PrimaryColumn('uuid', { name: 'provider_id' })
  providerId: string;

  @Column({ name: 'provider_name', length: 100 })
  providerName: string;

  @Column({ name: 'provider_type', length: 50 })
  providerType: string;

  @Column({ length: 20, unique: true })
  cuit: string;

  @Column({ name: 'contact_name', length: 100, nullable: true })
  contactName: string | null;

  @Column({ name: 'contact_phone', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'contact_email', length: 100, nullable: true })
  contactEmail: string | null;

  @Column({ length: 20 })
  status: string;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update' })
  lastUpdate: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'user_id', unique: true })
  userId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: Usuario;
} 