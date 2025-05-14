import { randomUUID } from 'crypto';

export class User {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly nombre: string,
    public readonly roleId: number,
    public readonly createdAt: Date
  ) {}

  static create(
    email: string,
    nombre: string,
    roleId: number,
    userId?: string,
    createdAt?: Date
  ): User {
    return new User(
      userId || randomUUID(),
      email,
      nombre,
      roleId,
      createdAt || new Date()
    );
  }
} 