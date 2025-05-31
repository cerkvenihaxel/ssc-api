import { Especialidad } from '../../models/especialidad/especialidad.model';

export interface IEspecialidadRepository {
  findAll(): Promise<Especialidad[]>;
  findById(especialidadId: string): Promise<Especialidad | null>;
  findByNombre(nombre: string): Promise<Especialidad | null>;
  findByCodigo(codigo: string): Promise<Especialidad | null>;
  findActive(): Promise<Especialidad[]>;
  save(especialidad: Especialidad): Promise<Especialidad>;
  update(especialidad: Especialidad): Promise<Especialidad>;
  delete(especialidadId: string): Promise<void>;
} 