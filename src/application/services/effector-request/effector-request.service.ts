import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { EffectorRequest } from '../../../domain/models/effector-request/effector-request.model';
import { EffectorRequestRepository } from '../../../domain/repositories/effector-request.repository';
import { CreateEffectorRequestDto } from '../../../api/v1/effector-requests/dtos/create-effector-request.dto';
import { UpdateEffectorRequestDto } from '../../../api/v1/effector-requests/dtos/update-effector-request.dto';
import { UpdateRequestStateDto } from '../../../api/v1/effector-requests/dtos/update-request-state.dto';
import { ApproveEffectorRequestDto } from '../../../api/v1/effector-requests/dtos/approve-effector-request.dto';
import { EffectorAIAnalysisService, EffectorRequestAIAnalysis } from './effector-ai-analysis.service';

@Injectable()
export class EffectorRequestService {
  constructor(
    @Inject('EffectorRequestRepository')
    private readonly effectorRequestRepository: EffectorRequestRepository,
    private readonly aiAnalysisService: EffectorAIAnalysisService,
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

  async create(createDto: CreateEffectorRequestDto, effectorId: string, createdBy?: string): Promise<EffectorRequest> {
    // Generate unique request number
    const timestamp = Date.now();
    const requestNumber = `REQ-${timestamp}`;

    // Calculate total estimated amount from items
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
      created_by: createdBy || effectorId,
      // Pass the items to be saved
      items: createDto.items?.map(item => ({
        article_code: item.article_code,
        article_name: item.article_name,
        description: item.description,
        quantity: item.quantity,
        unit_measure: item.unit_measure,
        expiration_date: item.expiration_date ? new Date(item.expiration_date) : undefined,
        technical_specifications: item.technical_specifications,
        estimated_unit_price: item.estimated_unit_price,
        estimated_total_price: item.estimated_total_price,
      })) as any || [],
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

  async analyzeWithAI(id: string): Promise<EffectorRequestAIAnalysis> {
    const request = await this.findById(id);
    if (!request) {
      throw new NotFoundException(`Effector request with ID ${id} not found`);
    }

    const analysis = await this.aiAnalysisService.analyzeEffectorRequest(request);
    
    // Optionally save the analysis result in the database
    await this.effectorRequestRepository.update(id, {
      ai_analysis_result: analysis as any,
      ai_analyzed_at: new Date(),
      updated_by: 'AI_SYSTEM'
    } as any);

    return analysis;
  }

  async approveRequest(
    id: string, 
    approvalDto: ApproveEffectorRequestDto, 
    approvedBy: string
  ): Promise<EffectorRequest> {
    const request = await this.findById(id);
    if (!request) {
      throw new NotFoundException(`Effector request with ID ${id} not found`);
    }

    // Determine the new state based on decision
    let newStateId: string;
    const stateMapping = {
      'approved': '49e0efbd-ee16-4e5b-a1a6-57c333ab309d', // APROBADO
      'rejected': '3ed234dc-7c8a-4568-97cc-a17791bd83ef', // RECHAZADO
      'partial': 'fbeb1fac-8570-440d-9624-21022f271643',  // EN_COTIZACION (for partial approvals)
      'needs_review': 'b5812d46-eb4d-434c-b548-90d2047c314d' // PENDIENTE
    };

    newStateId = stateMapping[approvalDto.decision] || stateMapping['needs_review'];

    const updates: any = {
      state_id: newStateId,
      approval_comments: approvalDto.approval_comments,
      rejection_reason: approvalDto.rejection_reason,
      approved_by: approvedBy,
      approved_at: new Date(),
      requires_medical_review: approvalDto.requires_medical_review,
      requires_economic_review: approvalDto.requires_economic_review,
      administrative_notes: approvalDto.administrative_notes,
      budget_impact_analysis: approvalDto.budget_impact_analysis,
      delivery_conditions: approvalDto.delivery_conditions,
      expiration_requirements: approvalDto.expiration_requirements,
      updated_by: approvedBy
    };

    // Update the main request
    const updatedRequest = await this.effectorRequestRepository.update(id, updates);

    // If there are item-level approvals, handle them
    if (approvalDto.items_approval && approvalDto.items_approval.length > 0) {
      await this.processItemApprovals(id, approvalDto.items_approval);
    }

    return updatedRequest;
  }

  private async processItemApprovals(requestId: string, itemApprovals: any[]): Promise<void> {
    // This would require extending the repository to handle item-level updates
    // For now, we'll store it as metadata
    for (const itemApproval of itemApprovals) {
      // In a real implementation, you'd update the effector_request_items table
      console.log(`Processing approval for item ${itemApproval.item_id}:`, itemApproval);
    }
  }

  async getRequestsRequiringReview(): Promise<EffectorRequest[]> {
    // Get requests that need manual review
    return this.effectorRequestRepository.findByState('b5812d46-eb4d-434c-b548-90d2047c314d'); // PENDIENTE
  }

  async getRequestsByPriority(priority: string): Promise<EffectorRequest[]> {
    return this.effectorRequestRepository.findAll()
      .then(requests => requests.filter(r => r.priority === priority));
  }

  async getRequestStatistics(): Promise<any> {
    const allRequests = await this.effectorRequestRepository.findAll();
    
    // Asegurar que los montos sean números
    const totalAmount = allRequests.reduce((sum, r) => sum + (parseFloat(r.total_estimated_amount?.toString() || '0') || 0), 0);
    const averageAmount = allRequests.length > 0 ? totalAmount / allRequests.length : 0;
    
    const stats = {
      total: allRequests.length,
      pendiente: allRequests.filter(r => r.state?.state_name === 'PENDIENTE').length,
      aprobado: allRequests.filter(r => r.state?.state_name === 'APROBADO').length,
      rechazado: allRequests.filter(r => r.state?.state_name === 'RECHAZADO').length,
      en_cotizacion: allRequests.filter(r => r.state?.state_name === 'EN_COTIZACION').length,
      cotizado: allRequests.filter(r => r.state?.state_name === 'COTIZADO').length,
      // Estadísticas de montos estimados
      totalAmount: totalAmount,
      averageAmount: averageAmount,
      // Estadísticas de items
      totalItems: allRequests.reduce((sum, r) => sum + (r.items?.length || 0), 0),
      averageItemsPerRequest: allRequests.length > 0 ? 
        allRequests.reduce((sum, r) => sum + (r.items?.length || 0), 0) / allRequests.length : 0,
      urgentRequests: allRequests.filter(r => r.priority === 'URGENTE').length,
      highPriorityRequests: allRequests.filter(r => r.priority === 'ALTA').length
    };

    return stats;
  }
} 