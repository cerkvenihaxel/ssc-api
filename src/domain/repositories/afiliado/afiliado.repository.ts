import { Afiliado } from '../../models/afiliado/afiliado.model';

export interface IAfiliadoRepository {
  findAll(): Promise<Afiliado[]>;
  findById(affiliateId: string): Promise<Afiliado | null>;
  findByEmail(email: string): Promise<Afiliado | null>;
  findByCuil(cuil: string): Promise<Afiliado | null>;
  findByAffiliateNumber(affiliateNumber: string): Promise<Afiliado | null>;
  save(afiliado: Afiliado): Promise<Afiliado>;
  update(afiliado: Afiliado): Promise<Afiliado>;
  delete(affiliateId: string): Promise<void>;
} 