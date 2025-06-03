import { Articulo } from '../../entities/articulo.entity';

export interface IArticuloRepository {
  // Operaciones CRUD básicas
  findById(articuloId: string): Promise<Articulo | null>;
  findAll(filters?: ArticuloFilters): Promise<Articulo[]>;
  findByProviderId(providerId: string): Promise<Articulo[]>;
  findByCodigo(codigo: string): Promise<Articulo | null>;
  save(articulo: Articulo): Promise<Articulo>;
  update(articulo: Articulo): Promise<Articulo>;
  delete(articuloId: string): Promise<void>;

  // Búsquedas específicas
  findByGrupoId(grupoId: string): Promise<Articulo[]>;
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Articulo[]>;
  findInStock(): Promise<Articulo[]>;
  findOutOfStock(): Promise<Articulo[]>;
  search(term: string): Promise<Articulo[]>;

  // Operaciones con grupos
  associateWithGrupo(articuloId: string, grupoId: string): Promise<void>;
  dissociateFromGrupo(articuloId: string, grupoId: string): Promise<void>;
  findGruposByArticuloId(articuloId: string): Promise<string[]>;
}

export interface ArticuloFilters {
  providerId?: string;
  grupoId?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
} 