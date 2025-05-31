import { Medico } from '../../models/medico/medico.model';

export interface IMedicoRepository {
  findAll(): Promise<Medico[]>;
  findById(medicoId: string): Promise<Medico | null>;
  findByMatricula(matricula: string): Promise<Medico | null>;
  findByEmail(email: string): Promise<Medico | null>;
  findByEspecialidad(especialidadId: string): Promise<Medico[]>;
  findByObraSocial(obraSocialId: string): Promise<Medico[]>;
  save(medico: Medico): Promise<Medico>;
  update(medico: Medico): Promise<Medico>;
  delete(medicoId: string): Promise<void>;
  associateWithObraSocial(medicoId: string, obraSocialId: string): Promise<void>;
  dissociateFromObraSocial(medicoId: string, obraSocialId: string): Promise<void>;
  getObrasSocialesAssociated(medicoId: string): Promise<string[]>;
} 