import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Address } from './address.entity';

@Entity('afiliados')
export class Affiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'affiliate_number', unique: true })
  affiliateNumber: string;

  @Column({ name: 'affiliate_status' })
  affiliateStatus: string;

  @CreateDateColumn({ name: 'creation_date' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'last_update' })
  lastUpdate: Date;

  @Column()
  cuil: string;

  @Column({ nullable: true })
  cvu: string;

  @Column({ name: 'document_type' })
  documentType: string;

  @Column({ name: 'document_number' })
  documentNumber: string;

  @Column({ name: 'document_country' })
  documentCountry: string;

  @Column()
  gender: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'birth_date' })
  birthDate: Date;

  @Column()
  nationality: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ name: 'signed_tyc_version', nullable: true })
  signedTycVersion: string;

  @Column({ name: 'signed_tyc_date', nullable: true })
  signedTycDate: Date;

  @Column({ name: 'primary_address_id', nullable: true })
  primaryAddressId: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToMany(() => Address, address => address.affiliate)
  addresses: Address[];
} 