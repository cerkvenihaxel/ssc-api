export class Permiso {
  constructor(
    public readonly permisoId: number,
    public readonly nombre: string,
    public readonly descripcion?: string
  ) {}

  static create(
    nombre: string,
    descripcion?: string,
    permisoId?: number
  ): Permiso {
    return new Permiso(
      permisoId || 0,
      nombre,
      descripcion
    );
  }
} 