import { User } from '../../models/user/user.model';

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(userId: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  getUserPermissions(userId: string): Promise<string[]>;
  getUserRole(userId: string): Promise<{ id: number; name: string; description: string }>;
} 