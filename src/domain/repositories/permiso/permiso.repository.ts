import { Permiso } from '../../models/permiso/permiso.model';

export interface IPermisoRepository {
  findAll(): Promise<Permiso[]>;
  findById(permisoId: number): Promise<Permiso | null>;
  findByNombre(nombre: string): Promise<Permiso | null>;
  save(permiso: Permiso): Promise<Permiso>;
  update(permiso: Permiso): Promise<Permiso>;
  delete(permisoId: number): Promise<void>;
} 