import { randomUUID } from 'crypto';

export class ObraSocial {
  constructor(
    public readonly healthcareProviderId: string,
    public readonly name: string,
    public readonly status: string,
    public readonly contactPhone: string | null,
    public readonly contactEmail: string | null,
    public readonly address: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
    public readonly updatedBy: string | null
  ) {}

  static create(
    name: string,
    status: string,
    options: {
      healthcareProviderId?: string,
      contactPhone?: string,
      contactEmail?: string,
      address?: string,
      createdBy?: string,
      updatedBy?: string
    } = {}
  ): ObraSocial {
    const now = new Date();
    return new ObraSocial(
      options.healthcareProviderId || randomUUID(),
      name,
      status,
      options.contactPhone || null,
      options.contactEmail || null,
      options.address || null,
      now,
      now,
      options.createdBy || null,
      options.updatedBy || null
    );
  }
} 