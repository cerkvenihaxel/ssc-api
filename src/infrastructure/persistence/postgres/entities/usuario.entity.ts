import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Add other usuario fields as needed, but for now we just need the ID
  // since it's only used as a foreign key reference
} 