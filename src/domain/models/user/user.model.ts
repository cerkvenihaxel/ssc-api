import { randomUUID } from 'crypto';

export class User {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly nombre: string,
    public readonly passwordHash: string | null,
    public readonly roleId: number,
    public readonly status: string,
    public readonly lastLogin: Date | null,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
    public readonly updatedBy: string | null
  ) {}

  static create(
    email: string,
    nombre: string,
    roleId: number,
    options: {
    userId?: string,
      passwordHash?: string,
      status?: string,
      emailVerified?: boolean,
      createdBy?: string,
    createdAt?: Date
    } = {}
  ): User {
    const now = options.createdAt || new Date();
    return new User(
      options.userId || randomUUID(),
      email,
      nombre,
      options.passwordHash || null,
      roleId,
      options.status || 'active',
      null, // lastLogin
      options.emailVerified || false,
      now,
      now,
      options.createdBy || null,
      null // updatedBy
    );
  }

  updateLastLogin(lastLogin: Date = new Date()): User {
    return new User(
      this.userId,
      this.email,
      this.nombre,
      this.passwordHash,
      this.roleId,
      this.status,
      lastLogin,
      this.emailVerified,
      this.createdAt,
      new Date(), // updatedAt
      this.createdBy,
      this.updatedBy
    );
  }

  updateStatus(status: string, updatedBy?: string): User {
    return new User(
      this.userId,
      this.email,
      this.nombre,
      this.passwordHash,
      this.roleId,
      status,
      this.lastLogin,
      this.emailVerified,
      this.createdAt,
      new Date(), // updatedAt
      this.createdBy,
      updatedBy || this.updatedBy
    );
  }

  verifyEmail(): User {
    return new User(
      this.userId,
      this.email,
      this.nombre,
      this.passwordHash,
      this.roleId,
      this.status,
      this.lastLogin,
      true, // emailVerified
      this.createdAt,
      new Date(), // updatedAt
      this.createdBy,
      this.updatedBy
    );
  }
} 