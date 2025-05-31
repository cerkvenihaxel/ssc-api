import { randomUUID } from 'crypto';

export class Especialidad {
  constructor(
    public readonly especialidadId: string,
    public readonly nombre: string,
    public readonly descripcion: string | null,
    public readonly codigo: string | null,
    public readonly activa: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    nombre: string,
    options: {
      especialidadId?: string,
      descripcion?: string,
      codigo?: string,
      activa?: boolean
    } = {}
  ): Especialidad {
    const now = new Date();
    return new Especialidad(
      options.especialidadId || randomUUID(),
      nombre,
      options.descripcion || null,
      options.codigo || null,
      options.activa !== undefined ? options.activa : true,
      now,
      now
    );
  }

  activate(): Especialidad {
    return new Especialidad(
      this.especialidadId,
      this.nombre,
      this.descripcion,
      this.codigo,
      true,
      this.createdAt,
      new Date()
    );
  }

  deactivate(): Especialidad {
    return new Especialidad(
      this.especialidadId,
      this.nombre,
      this.descripcion,
      this.codigo,
      false,
      this.createdAt,
      new Date()
    );
  }
} 