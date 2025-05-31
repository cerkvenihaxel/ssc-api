import { randomUUID } from 'crypto';

export class Proveedor {
  constructor(
    public readonly providerId: string,
    public readonly providerName: string,
    public readonly providerType: string,
    public readonly cuit: string,
    public readonly contactName: string | null,
    public readonly contactPhone: string | null,
    public readonly contactEmail: string | null,
    public readonly status: string,
    public readonly creationDate: Date,
    public readonly lastUpdate: Date,
    public readonly createdBy: string | null,
    public readonly updatedBy: string | null,
    public readonly userId: string | null,
    public readonly specialties?: string[] // IDs de especialidades
  ) {}

  static create(
    providerName: string,
    providerType: string,
    cuit: string,
    status: string,
    options: {
      providerId?: string,
      contactName?: string,
      contactPhone?: string,
      contactEmail?: string,
      createdBy?: string,
      updatedBy?: string,
      userId?: string,
      specialties?: string[]
    } = {}
  ): Proveedor {
    const now = new Date();
    return new Proveedor(
      options.providerId || randomUUID(),
      providerName,
      providerType,
      cuit,
      options.contactName || null,
      options.contactPhone || null,
      options.contactEmail || null,
      status,
      now,
      now,
      options.createdBy || null,
      options.updatedBy || null,
      options.userId || null,
      options.specialties || []
    );
  }
} 