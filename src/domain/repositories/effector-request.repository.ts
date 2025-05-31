import { EffectorRequest } from '../models/effector-request/effector-request.model';

export interface EffectorRequestRepository {
  findAll(): Promise<EffectorRequest[]>;
  findById(id: string): Promise<EffectorRequest | null>;
  findByEffectorId(effectorId: string): Promise<EffectorRequest[]>;
  findByState(stateId: string): Promise<EffectorRequest[]>;
  create(request: Partial<EffectorRequest>): Promise<EffectorRequest>;
  update(id: string, request: Partial<EffectorRequest>): Promise<EffectorRequest>;
  delete(id: string): Promise<void>;
  updateState(id: string, stateId: string, updatedBy?: string): Promise<EffectorRequest>;
} 