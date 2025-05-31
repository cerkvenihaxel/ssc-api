import { randomUUID } from 'crypto';

export class Medico {
  constructor(
    public readonly medicoId: string,
    public readonly matricula: string,
    public readonly especialidadId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly phone: string | null,
    public readonly picture: string | null,
    public readonly userId: string | null,
    public readonly creationDate: Date,
    public readonly lastUpdate: Date,
    public readonly createdBy: string | null,
    public readonly updatedBy: string | null,
    // Información del usuario asociado
    public readonly userStatus: string | null = null,
    public readonly userEmailVerified: boolean | null = null,
    public readonly userLastLogin: Date | null = null,
    public readonly userCreatedAt: Date | null = null
  ) {}

  static create(
    matricula: string,
    especialidadId: string,
    firstName: string,
    lastName: string,
    email: string,
    options: {
      medicoId?: string,
      phone?: string,
      picture?: string,
      userId?: string,
      createdBy?: string
    } = {}
  ): Medico {
    const now = new Date();
    return new Medico(
      options.medicoId || randomUUID(),
      matricula,
      especialidadId,
      firstName,
      lastName,
      email,
      options.phone || null,
      options.picture || null,
      options.userId || null,
      now,
      now,
      options.createdBy || null,
      null,
      null,
      null,
      null,
      null
    );
  }

  updateInfo(
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    picture?: string,
    updatedBy?: string
  ): Medico {
    return new Medico(
      this.medicoId,
      this.matricula,
      this.especialidadId,
      firstName || this.firstName,
      lastName || this.lastName,
      email || this.email,
      phone !== undefined ? phone : this.phone,
      picture !== undefined ? picture : this.picture,
      this.userId,
      this.creationDate,
      new Date(),
      this.createdBy,
      updatedBy || this.updatedBy,
      this.userStatus,
      this.userEmailVerified,
      this.userLastLogin,
      this.userCreatedAt
    );
  }

  get fullName(): string {
    return `Dr. ${this.firstName} ${this.lastName}`;
  }
} 