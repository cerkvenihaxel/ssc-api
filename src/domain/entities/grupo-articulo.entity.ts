import { randomUUID } from 'crypto';

export class GrupoArticulo {
  constructor(
    public readonly grupoId: string,
    public readonly nombre: string,
    public readonly descripcion: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    nombre: string,
    options: {
      grupoId?: string;
      descripcion?: string;
    } = {}
  ): GrupoArticulo {
    const now = new Date();
    return new GrupoArticulo(
      options.grupoId || randomUUID(),
      nombre,
      options.descripcion || null,
      now,
      now
    );
  }

  // Método para validar nombre único
  isValidName(): boolean {
    return this.nombre.trim().length > 0 && this.nombre.length <= 100;
  }

  // Método para actualizar información
  update(nombre: string, descripcion?: string): GrupoArticulo {
    return new GrupoArticulo(
      this.grupoId,
      nombre,
      descripcion || null,
      this.createdAt,
      new Date()
    );
  }
} 