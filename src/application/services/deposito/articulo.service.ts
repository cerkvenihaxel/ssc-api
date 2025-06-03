import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { IArticuloRepository, ArticuloFilters } from '../../../domain/repositories/articulo/articulo.repository';
import { Articulo } from '../../../domain/entities/articulo.entity';
import { CreateArticuloDto } from '../../../api/dtos/deposito/create-articulo.dto';
import { UpdateArticuloDto } from '../../../api/dtos/deposito/update-articulo.dto';

// Token para inyección de dependencias
const ARTICULO_REPOSITORY_TOKEN = 'IArticuloRepository';

@Injectable()
export class ArticuloService {
  constructor(
    @Inject(ARTICULO_REPOSITORY_TOKEN)
    private readonly articuloRepository: IArticuloRepository
  ) {}

  async createArticulo(createDto: CreateArticuloDto): Promise<Articulo> {
    // Validar que el código no exista
    const existingArticulo = await this.articuloRepository.findByCodigo(createDto.codigo);
    if (existingArticulo) {
      throw new ConflictException(`Ya existe un artículo con el código: ${createDto.codigo}`);
    }

    // Crear la entidad de dominio
    const articulo = Articulo.create(
      createDto.providerId,
      createDto.codigo,
      createDto.nombre,
      createDto.precio,
      {
        descripcion: createDto.descripcion,
        presentacion: createDto.presentacion,
        stock: createDto.stock,
        grupos: createDto.grupos
      }
    );

    return this.articuloRepository.save(articulo);
  }

  async findAllArticulos(filters?: ArticuloFilters): Promise<Articulo[]> {
    return this.articuloRepository.findAll(filters);
  }

  async findArticuloById(articuloId: string): Promise<Articulo> {
    const articulo = await this.articuloRepository.findById(articuloId);
    if (!articulo) {
      throw new NotFoundException(`Artículo con ID ${articuloId} no encontrado`);
    }
    return articulo;
  }

  async updateArticulo(articuloId: string, updateDto: UpdateArticuloDto): Promise<Articulo> {
    const existingArticulo = await this.findArticuloById(articuloId);

    // Validar código único si se está actualizando
    if (updateDto.codigo && updateDto.codigo !== existingArticulo.codigo) {
      const conflictingArticulo = await this.articuloRepository.findByCodigo(updateDto.codigo);
      if (conflictingArticulo) {
        throw new ConflictException(`Ya existe un artículo con el código: ${updateDto.codigo}`);
      }
    }

    // Crear artículo actualizado
    const updatedArticulo = new Articulo(
      existingArticulo.articuloId,
      existingArticulo.providerId,
      updateDto.codigo ?? existingArticulo.codigo,
      updateDto.nombre ?? existingArticulo.nombre,
      updateDto.descripcion !== undefined ? updateDto.descripcion : existingArticulo.descripcion,
      updateDto.presentacion !== undefined ? updateDto.presentacion : existingArticulo.presentacion,
      updateDto.precio ?? existingArticulo.precio,
      updateDto.stock !== undefined ? updateDto.stock : existingArticulo.stock,
      updateDto.precio ? new Date() : existingArticulo.lastPriceUpdate,
      existingArticulo.createdAt,
      new Date(),
      updateDto.grupos ?? existingArticulo.grupos
    );

    return this.articuloRepository.update(updatedArticulo);
  }

  async deleteArticulo(articuloId: string): Promise<void> {
    const articulo = await this.findArticuloById(articuloId);
    await this.articuloRepository.delete(articulo.articuloId);
  }

  async searchArticulos(term: string): Promise<Articulo[]> {
    if (!term || term.trim().length < 2) {
      throw new BadRequestException('El término de búsqueda debe tener al menos 2 caracteres');
    }
    return this.articuloRepository.search(term.trim());
  }
} 