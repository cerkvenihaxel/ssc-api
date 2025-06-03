import { randomUUID } from 'crypto';

export class Articulo {
  constructor(
    public readonly articuloId: string,
    public readonly providerId: string,
    public readonly codigo: string,
    public readonly nombre: string,
    public readonly descripcion: string | null,
    public readonly presentacion: string | null,
    public readonly precio: number,
    public readonly stock: number | null,
    public readonly lastPriceUpdate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly grupos?: string[] // IDs de grupos asociados
  ) {}

  static create(
    providerId: string,
    codigo: string,
    nombre: string,
    precio: number,
    options: {
      articuloId?: string;
      descripcion?: string;
      presentacion?: string;
      stock?: number;
      lastPriceUpdate?: Date;
      grupos?: string[];
    } = {}
  ): Articulo {
    const now = new Date();
    return new Articulo(
      options.articuloId || randomUUID(),
      providerId,
      codigo,
      nombre,
      options.descripcion || null,
      options.presentacion || null,
      precio,
      options.stock || null,
      options.lastPriceUpdate || null,
      now,
      now,
      options.grupos || []
    );
  }

  // Métodos de dominio
  updatePrice(newPrice: number): Articulo {
    return new Articulo(
      this.articuloId,
      this.providerId,
      this.codigo,
      this.nombre,
      this.descripcion,
      this.presentacion,
      newPrice,
      this.stock,
      new Date(),
      this.createdAt,
      new Date(),
      this.grupos
    );
  }

  updateStock(newStock: number): Articulo {
    return new Articulo(
      this.articuloId,
      this.providerId,
      this.codigo,
      this.nombre,
      this.descripcion,
      this.presentacion,
      this.precio,
      newStock,
      this.lastPriceUpdate,
      this.createdAt,
      new Date(),
      this.grupos
    );
  }

  isInStock(): boolean {
    return this.stock !== null && this.stock > 0;
  }

  belongsToProvider(providerId: string): boolean {
    return this.providerId === providerId;
  }
} 