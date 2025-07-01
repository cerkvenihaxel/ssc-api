import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EffectorRequestRepository } from '../../../domain/repositories/effector-request.repository';
import { EffectorRequest } from '../../../domain/models/effector-request/effector-request.model';
import { EffectorRequestEntity } from '../../entities/effector-request.entity';
import { EffectorRequestItemEntity } from '../../entities/effector-request-item.entity';
import { EffectorRequestAttachmentEntity } from '../../entities/effector-request-attachment.entity';
import { EffectorRequestStateEntity } from '../../entities/effector-request-state.entity';

@Injectable()
export class EffectorRequestRepositoryImpl implements EffectorRequestRepository {
  constructor(
    @InjectRepository(EffectorRequestEntity)
    private readonly requestRepository: Repository<EffectorRequestEntity>,
    @InjectRepository(EffectorRequestItemEntity)
    private readonly itemRepository: Repository<EffectorRequestItemEntity>,
    @InjectRepository(EffectorRequestAttachmentEntity)
    private readonly attachmentRepository: Repository<EffectorRequestAttachmentEntity>,
    @InjectRepository(EffectorRequestStateEntity)
    private readonly stateRepository: Repository<EffectorRequestStateEntity>,
  ) {}

  async findAll(): Promise<EffectorRequest[]> {
    const entities = await this.requestRepository.find({
      relations: ['state', 'items', 'attachments'],
      order: { created_at: 'DESC' },
    });
    
    return Promise.all(entities.map(entity => this.mapEntityToModelWithEffector(entity)));
  }

  async findById(id: string): Promise<EffectorRequest | null> {
    const entity = await this.requestRepository.findOne({
      where: { request_id: id },
      relations: ['state', 'items', 'attachments'],
    });
    return entity ? await this.mapEntityToModelWithEffector(entity) : null;
  }

  async findByEffectorId(effectorId: string): Promise<EffectorRequest[]> {
    const entities = await this.requestRepository.find({
      where: { effector_id: effectorId },
      relations: ['state', 'items', 'attachments'],
      order: { created_at: 'DESC' },
    });
    return Promise.all(entities.map(entity => this.mapEntityToModelWithEffector(entity)));
  }

  async findByState(stateId: string): Promise<EffectorRequest[]> {
    const entities = await this.requestRepository.find({
      where: { state_id: stateId },
      relations: ['state', 'items', 'attachments'],
      order: { created_at: 'DESC' },
    });
    return Promise.all(entities.map(entity => this.mapEntityToModelWithEffector(entity)));
  }

  async create(request: Partial<EffectorRequest>): Promise<EffectorRequest> {
    // Get default PENDIENTE state if not provided
    if (!request.state_id) {
      const pendingState = await this.stateRepository.findOne({
        where: { state_name: 'PENDIENTE' }
      });
      if (pendingState) {
        request.state_id = pendingState.state_id;
      }
    }

    const entity = this.requestRepository.create({
      effector_id: request.effector_id,
      request_number: request.request_number,
      title: request.title,
      description: request.description,
      state_id: request.state_id,
      priority: request.priority,
      delivery_date: request.delivery_date,
      delivery_address: request.delivery_address,
      contact_person: request.contact_person,
      contact_phone: request.contact_phone,
      contact_email: request.contact_email,
      total_estimated_amount: request.total_estimated_amount,
      created_by: request.created_by,
      updated_by: request.updated_by,
    });

    const savedEntity = await this.requestRepository.save(entity);
    
    // Save items if provided
    if (request.items && request.items.length > 0) {
      const itemEntities = request.items.map(item => 
        this.itemRepository.create({
          request_id: savedEntity.request_id,
          article_code: item.article_code,
          article_name: item.article_name,
          description: item.description,
          quantity: item.quantity,
          unit_measure: item.unit_measure,
          expiration_date: item.expiration_date,
          technical_specifications: item.technical_specifications,
          estimated_unit_price: item.estimated_unit_price,
          estimated_total_price: item.estimated_total_price,
        })
      );
      await this.itemRepository.save(itemEntities);
    }

    return this.findById(savedEntity.request_id);
  }

  async update(id: string, request: Partial<EffectorRequest>): Promise<EffectorRequest> {
    await this.requestRepository.update(id, {
      title: request.title,
      description: request.description,
      priority: request.priority,
      delivery_date: request.delivery_date,
      delivery_address: request.delivery_address,
      contact_person: request.contact_person,
      contact_phone: request.contact_phone,
      contact_email: request.contact_email,
      total_estimated_amount: request.total_estimated_amount,
      updated_by: request.updated_by,
    });

    return this.findById(id)!;
  }

  async delete(id: string): Promise<void> {
    // Delete related records first
    await this.attachmentRepository.delete({ request_id: id });
    await this.itemRepository.delete({ request_id: id });
    await this.requestRepository.delete(id);
  }

  async updateState(id: string, stateId: string, updatedBy?: string): Promise<EffectorRequest> {
    await this.requestRepository.update(id, {
      state_id: stateId,
      updated_by: updatedBy,
    });

    return this.findById(id)!;
  }

  private mapEntityToModel(entity: EffectorRequestEntity): EffectorRequest {
    return {
      request_id: entity.request_id,
      effector_id: entity.effector_id,
      request_number: entity.request_number,
      title: entity.title,
      description: entity.description,
      state_id: entity.state_id,
      state: entity.state ? {
        state_id: entity.state.state_id,
        state_name: entity.state.state_name,
        description: entity.state.description,
      } : undefined,
      priority: entity.priority,
      delivery_date: entity.delivery_date,
      delivery_address: entity.delivery_address,
      contact_person: entity.contact_person,
      contact_phone: entity.contact_phone,
      contact_email: entity.contact_email,
      total_estimated_amount: entity.total_estimated_amount,
      items: entity.items?.map(item => ({
        item_id: item.item_id,
        request_id: item.request_id,
        article_code: item.article_code,
        article_name: item.article_name,
        description: item.description,
        quantity: item.quantity,
        unit_measure: item.unit_measure,
        expiration_date: item.expiration_date,
        technical_specifications: item.technical_specifications,
        estimated_unit_price: item.estimated_unit_price,
        estimated_total_price: item.estimated_total_price,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) || [],
      attachments: entity.attachments?.map(attachment => ({
        attachment_id: attachment.attachment_id,
        request_id: attachment.request_id,
        file_name: attachment.file_name,
        file_path: attachment.file_path,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        uploaded_by: attachment.uploaded_by,
        uploaded_at: attachment.uploaded_at,
      })) || [],
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
    };
  }

  private async mapEntityToModelWithEffector(entity: EffectorRequestEntity): Promise<EffectorRequest> {
    const baseModel = this.mapEntityToModel(entity);
    
    if (entity.effector_id) {
      try {
        // Query effector information from usuarios table
        const effectorQuery = `
          SELECT 
            u.user_id,
            u.nombre,
            u.email,
            u.effector_info
          FROM usuarios u
          WHERE u.user_id = $1
        `;
        
        const effectorResult = await this.requestRepository.query(effectorQuery, [entity.effector_id]);
        
        if (effectorResult.length > 0) {
          const effector = effectorResult[0];
          let effectorInfo: any = {};
          
          // Try to parse effector_info JSON if it exists and is not null
          if (effector.effector_info) {
            try {
              // Si effector_info es de tipo jsonb, ya viene parseado como objeto
              effectorInfo = typeof effector.effector_info === 'string' 
                ? JSON.parse(effector.effector_info) 
                : effector.effector_info;
            } catch (error) {
              console.log('Error parsing effector_info JSON:', error);
              effectorInfo = {};
            }
          }
          
          // Set effector information with fallbacks to basic user data
          // Support both old and new field naming conventions
          baseModel.effector_info = {
            effector_name: effectorInfo.effector_name || effectorInfo.institution_name || effector.nombre || 'Sin información',
            effector_type: effectorInfo.effector_type || effectorInfo.institution_type || effectorInfo.tipo || 'Sistema SSC',
            contact_name: effectorInfo.contact_name || effector.nombre,
            contact_phone: effectorInfo.contact_phone || effectorInfo.telefono,
            contact_email: effectorInfo.contact_email || effector.email,
            address: effectorInfo.address || effectorInfo.direccion,
          };
        }
      } catch (error) {
        console.error('Error loading effector info:', error);
      }
    }
    
    return baseModel;
  }
} 