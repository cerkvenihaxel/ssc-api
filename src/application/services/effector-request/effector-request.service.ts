import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { EffectorRequest } from '../../../domain/models/effector-request/effector-request.model';
import { EffectorRequestRepository } from '../../../domain/repositories/effector-request.repository';
import { CreateEffectorRequestDto } from '../../../api/v1/effector-requests/dtos/create-effector-request.dto';
import { UpdateEffectorRequestDto } from '../../../api/v1/effector-requests/dtos/update-effector-request.dto';
import { UpdateRequestStateDto } from '../../../api/v1/effector-requests/dtos/update-request-state.dto';

@Injectable()
export class EffectorRequestService {
  constructor(
    @Inject('EffectorRequestRepository')
    private readonly effectorRequestRepository: EffectorRequestRepository,
  ) {}

  async findAll(): Promise<EffectorRequest[]> {
    return this.effectorRequestRepository.findAll();
  }

  async findById(id: string): Promise<EffectorRequest> {
    const request = await this.effectorRequestRepository.findById(id);
    if (!request) {
      throw new NotFoundException(`Effector request with ID ${id} not found`);
    }
    return request;
  }

  async findByEffectorId(effectorId: string): Promise<EffectorRequest[]> {
    return this.effectorRequestRepository.findByEffectorId(effectorId);
  }

  async findByState(stateId: string): Promise<EffectorRequest[]> {
    return this.effectorRequestRepository.findByState(stateId);
  }

  async create(createDto: CreateEffectorRequestDto, effectorId: string): Promise<EffectorRequest> {
    // Generate unique request number
    const timestamp = Date.now();
    const requestNumber = `REQ-${timestamp}`;

    // Calculate total estimated amount
    const totalEstimatedAmount = createDto.items?.reduce((total, item) => {
      return total + (item.estimated_total_price || (item.estimated_unit_price || 0) * item.quantity);
    }, 0) || 0;

    const request: Partial<EffectorRequest> = {
      effector_id: effectorId,
      request_number: requestNumber,
      title: createDto.title,
      description: createDto.description,
      priority: createDto.priority || 'NORMAL',
      delivery_date: createDto.delivery_date ? new Date(createDto.delivery_date) : undefined,
      delivery_address: createDto.delivery_address,
      contact_person: createDto.contact_person,
      contact_phone: createDto.contact_phone,
      contact_email: createDto.contact_email,
      total_estimated_amount: totalEstimatedAmount,
      created_by: effectorId,
      // Will be set to PENDIENTE state by default in repository
    };

    return this.effectorRequestRepository.create(request);
  }

  async update(id: string, updateDto: UpdateEffectorRequestDto, updatedBy?: string): Promise<EffectorRequest> {
    const existingRequest = await this.findById(id);
    
    const updates: Partial<EffectorRequest> = {
      title: updateDto.title,
      description: updateDto.description,
      priority: updateDto.priority,
      delivery_date: updateDto.delivery_date ? new Date(updateDto.delivery_date) : undefined,
      delivery_address: updateDto.delivery_address,
      contact_person: updateDto.contact_person,
      contact_phone: updateDto.contact_phone,
      contact_email: updateDto.contact_email,
      updated_by: updatedBy,
    };

    // Recalculate total if items are provided
    if (updateDto.items) {
      const totalEstimatedAmount = updateDto.items.reduce((total, item) => {
        return total + (item.estimated_total_price || (item.estimated_unit_price || 0) * item.quantity);
      }, 0);
      updates.total_estimated_amount = totalEstimatedAmount;
    }

    return this.effectorRequestRepository.update(id, updates);
  }

  async updateState(id: string, updateStateDto: UpdateRequestStateDto, updatedBy?: string): Promise<EffectorRequest> {
    const request = await this.findById(id);
    
    // Business rules for state transitions
    this.validateStateTransition(request.state?.state_name, updateStateDto.state_name);

    // In a real implementation, you would get the state_id from state_name
    // For now, we assume we have a method to resolve this
    const stateId = await this.getStateIdByName(updateStateDto.state_name);
    
    return this.effectorRequestRepository.updateState(id, stateId, updatedBy);
  }

  async delete(id: string): Promise<void> {
    const request = await this.findById(id);
    
    // Business rule: Only allow deletion of PENDIENTE or RECHAZADO requests
    if (request.state?.state_name && !['PENDIENTE', 'RECHAZADO', 'CANCELADO'].includes(request.state.state_name)) {
      throw new BadRequestException('Cannot delete request in current state');
    }

    return this.effectorRequestRepository.delete(id);
  }

  private validateStateTransition(currentState: string | undefined, newState: string): void {
    // Define valid state transitions
    const validTransitions: Record<string, string[]> = {
      'PENDIENTE': ['APROBADO', 'RECHAZADO', 'CANCELADO'],
      'APROBADO': ['EN_COTIZACION', 'CANCELADO'],
      'EN_COTIZACION': ['COTIZADO', 'CANCELADO'],
      'COTIZADO': ['ADJUDICADO', 'CANCELADO'],
      'RECHAZADO': [], // No transitions allowed from rejected
      'CANCELADO': [], // No transitions allowed from canceled
      'ADJUDICADO': [], // Final state
    };

    if (!currentState || !validTransitions[currentState]?.includes(newState)) {
      throw new BadRequestException(`Invalid state transition from ${currentState} to ${newState}`);
    }
  }

  private async getStateIdByName(stateName: string): Promise<string> {
    // This would typically query the effector_request_states table
    // For now, return a placeholder - this needs to be implemented
    // in the repository layer
    return 'state-id-placeholder';
  }
} 