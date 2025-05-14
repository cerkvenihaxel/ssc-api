import { User } from '../../models/user/user.model';

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
} 