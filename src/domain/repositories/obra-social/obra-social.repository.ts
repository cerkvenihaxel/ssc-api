import { ObraSocial } from '../../models/obra-social/obra-social.model';

export interface IObraSocialRepository {
  findAll(): Promise<ObraSocial[]>;
  findById(healthcareProviderId: string): Promise<ObraSocial | null>;
  findByName(name: string): Promise<ObraSocial | null>;
  save(obraSocial: ObraSocial): Promise<ObraSocial>;
  update(obraSocial: ObraSocial): Promise<ObraSocial>;
  delete(healthcareProviderId: string): Promise<void>;
} 