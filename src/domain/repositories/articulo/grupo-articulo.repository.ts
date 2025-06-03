import { GrupoArticulo } from '../../entities/grupo-articulo.entity';

export interface IGrupoArticuloRepository {
  // Operaciones CRUD básicas
  findById(grupoId: string): Promise<GrupoArticulo | null>;
  findAll(): Promise<GrupoArticulo[]>;
  findByNombre(nombre: string): Promise<GrupoArticulo | null>;
  save(grupo: GrupoArticulo): Promise<GrupoArticulo>;
  update(grupo: GrupoArticulo): Promise<GrupoArticulo>;
  delete(grupoId: string): Promise<void>;

  // Búsquedas específicas
  search(term: string): Promise<GrupoArticulo[]>;
  findGruposWithArticles(): Promise<GrupoArticulo[]>;
  findEmptyGrupos(): Promise<GrupoArticulo[]>;
} 