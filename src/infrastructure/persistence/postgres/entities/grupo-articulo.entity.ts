import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { ArticuloEntity } from './articulo.entity';

@Entity('grupos_articulos')
export class GrupoArticuloEntity {
  @PrimaryColumn('uuid', { name: 'grupo_id' })
  grupoId: string;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación
  @ManyToMany(() => ArticuloEntity, articulo => articulo.grupos)
  articulos: ArticuloEntity[];
} 