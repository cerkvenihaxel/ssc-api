import { Proveedor } from '../../models/proveedor/proveedor.model';

export interface IProveedorRepository {
  findAll(): Promise<Proveedor[]>;
  findById(providerId: string): Promise<Proveedor | null>;
  findByName(providerName: string): Promise<Proveedor | null>;
  findByCuit(cuit: string): Promise<Proveedor | null>;
  save(proveedor: Proveedor): Promise<Proveedor>;
  update(proveedor: Proveedor): Promise<Proveedor>;
  delete(providerId: string): Promise<void>;
} 