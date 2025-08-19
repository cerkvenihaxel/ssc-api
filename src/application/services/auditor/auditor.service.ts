import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditRequestEntity } from '../../../infrastructure/entities/audit-request.entity';
import { ProviderQuotationEntity } from '../../../infrastructure/entities/provider-quotation.entity';
import { 
  MedicalOrderTypeOrmEntity, 
  MedicalOrderItemTypeOrmEntity,
  MedicalCategoryTypeOrmEntity,
  UrgencyTypeTypeOrmEntity
} from '../../../infrastructure/entities/medical-order.typeorm-entity';
import { ProveedorEntity } from '../../../infrastructure/persistence/postgres/entities/proveedor.entity';
import { Affiliate } from '../../../domain/entities/affiliate.entity';
import { CreateAuditRequestDto } from '../../../api/v1/auditor/dtos/create-audit-request.dto';
import { UpdateAuditRequestDto } from '../../../api/v1/auditor/dtos/update-audit-request.dto';

@Injectable()
export class AuditorService {
  constructor(
    @InjectRepository(AuditRequestEntity)
    private readonly auditRequestRepository: Repository<AuditRequestEntity>,
    @InjectRepository(ProviderQuotationEntity)
    private readonly providerQuotationRepository: Repository<ProviderQuotationEntity>,
    @InjectRepository(MedicalOrderTypeOrmEntity)
    private readonly medicalOrderRepository: Repository<MedicalOrderTypeOrmEntity>,
    @InjectRepository(ProveedorEntity)
    private readonly proveedorRepository: Repository<ProveedorEntity>,
    @InjectRepository(Affiliate)
    private readonly affiliateRepository: Repository<Affiliate>,
    @InjectRepository(MedicalOrderItemTypeOrmEntity)
    private readonly medicalOrderItemRepository: Repository<MedicalOrderItemTypeOrmEntity>,
    @InjectRepository(MedicalCategoryTypeOrmEntity)
    private readonly medicalCategoryRepository: Repository<MedicalCategoryTypeOrmEntity>,
    @InjectRepository(UrgencyTypeTypeOrmEntity)
    private readonly urgencyTypeRepository: Repository<UrgencyTypeTypeOrmEntity>,
  ) {}

  // =============== COTIZACIONES PENDIENTES DE AUDITORÍA ===============

  async getPendingQuotations(userId: string, userRole: string, filters: {
    status?: string;
    provider_id?: string;
    date_from?: string;
    date_to?: string;
    patient_name?: string;
    medical_order_id?: string;
    page?: number;
    limit?: number;
  }) {
    const { 
      status, 
      provider_id, 
      date_from, 
      date_to, 
      patient_name, 
      medical_order_id, 
      page = 1, 
      limit = 10 
    } = filters;
    
    // Validar parámetros de paginación
    const validatedPage = Math.max(1, Math.min(page, 1000)); // Máximo 1000 páginas
    const validatedLimit = Math.max(1, Math.min(limit, 100)); // Máximo 100 elementos por página
    const offset = (validatedPage - 1) * validatedLimit;

    console.log('[AuditorService] Obteniendo cotizaciones pendientes de auditoría:', {
      userId,
      userRole,
      filters
    });

    // Obtener cotizaciones disponibles para auditoría
    const quotationsQuery = this.providerQuotationRepository.createQueryBuilder('pq')
      .leftJoinAndSelect('pq.items', 'items')
      .leftJoinAndSelect('pq.attachments', 'attachments')
      .where('pq.available_for_audit = :available', { available: true })
      .andWhere(`
        NOT EXISTS (
          SELECT 1 FROM audit_requests ar 
          WHERE ar.quotation_id = pq.quotation_id
        )
      `);

    if (status) {
      quotationsQuery.andWhere('pq.status = :status', { status });
    } else {
      // Por defecto, mostrar cotizaciones enviadas y pendientes
      quotationsQuery.andWhere('pq.status IN (:...statuses)', { statuses: ['sent', 'pending'] });
    }

    if (provider_id) {
      quotationsQuery.andWhere('pq.provider_id = :provider_id', { provider_id });
    }

    if (date_from) {
      quotationsQuery.andWhere('pq.created_at >= :date_from', { date_from });
    }

    if (date_to) {
      quotationsQuery.andWhere('pq.created_at <= :date_to', { date_to });
    }

    if (medical_order_id) {
      quotationsQuery.andWhere('pq.request_id = :medical_order_id', { medical_order_id });
    }

    // Obtener total para paginación
    const total = await quotationsQuery.getCount();

    const quotations = await quotationsQuery
      .orderBy('pq.created_at', 'DESC')
      .limit(validatedLimit)
      .offset(offset)
      .getMany();

    console.log('[AuditorService] Cotizaciones encontradas para auditoría:', quotations.length);

    // Formatear resultados
    const results = await Promise.all(quotations.map(async (quotation) => {
      // Obtener información del pedido médico
      const medicalOrder = await this.medicalOrderRepository.findOne({
        where: { order_id: quotation.request_id }
      });

      // Obtener información del proveedor
      const provider = await this.proveedorRepository.findOne({
        where: { providerId: quotation.provider_id }
      });

      // Obtener información del afiliado (paciente)
      let patientName = 'N/A';
      if (medicalOrder) {
        const affiliate = await this.affiliateRepository.findOne({
          where: { affiliate_id: medicalOrder.affiliate_id }
        });
        if (affiliate) {
          patientName = `${affiliate.firstName} ${affiliate.lastName}`;
        }
      }

      // Obtener información de los items con nombres y categorías
      const itemsWithDetails = await Promise.all(
        (quotation.items || []).map(async (item) => {
          const medicalOrderItem = await this.medicalOrderItemRepository.findOne({
            where: { item_id: item.request_item_id }
          });

          let categoryName = null;
          if (medicalOrderItem) {
            const category = await this.medicalCategoryRepository.findOne({
              where: { category_id: medicalOrderItem.category_id }
            });
            categoryName = category?.category_name || null;
          }

          return {
            item_id: item.quotation_item_id,
            name: medicalOrderItem?.item_name || item.request_item_id,
            description: item.observations,
            quantity: item.quantity,
            unit_cost: item.unit_price,
            total_cost: item.total_price,
            category: categoryName
          };
        })
      );

      // Obtener información de urgencia
      let urgency = 'medium';
      if (medicalOrder) {
        const urgencyType = await this.urgencyTypeRepository.findOne({
          where: { urgency_id: medicalOrder.urgency_id }
        });
        urgency = urgencyType?.urgency_name?.toLowerCase() || 'medium';
      }

      return {
        quotation_id: quotation.quotation_id,
        medical_order_id: quotation.request_id,
        provider_id: quotation.provider_id,
        provider_name: provider?.providerName || quotation.provider_id,
        patient_name: patientName,
        total_cost: quotation.total_amount,
        delivery_days: quotation.delivery_time_days,
        items_count: quotation.items?.length || 0,
        status: quotation.status || 'pending',
        created_at: quotation.created_at,
        updated_at: quotation.updated_at,
        items: itemsWithDetails,
        medical_order: medicalOrder ? {
          medical_order_id: medicalOrder.order_id,
          patient_name: patientName,
          doctor_name: null, // TODO: Implementar obtención del doctor desde healthcare_provider
          specialty: medicalOrder.specialties,
          urgency: urgency,
          created_at: medicalOrder.created_at
        } : null
      };
    }));

    return {
      success: true,
      data: {
        data: results,
        total,
        page: validatedPage,
        limit: validatedLimit,
        total_pages: Math.ceil(total / validatedLimit)
      }
    };
  }

  // =============== SOLICITUDES PARA AUDITAR (DEPRECATED) ===============

  async getPendingAuditRequests(userId: string, userRole: string, filters: {
    status?: string;
    providerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, providerId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    console.log('[AuditorService] Obteniendo solicitudes pendientes de auditoría:', {
      userId,
      userRole,
      filters
    });

    // Obtener cotizaciones disponibles para auditoría
    const quotationsQuery = this.providerQuotationRepository.createQueryBuilder('pq')
      .where('pq.available_for_audit = :available', { available: true })
      .andWhere(`
        NOT EXISTS (
          SELECT 1 FROM audit_requests ar 
          WHERE ar.quotation_id = pq.quotation_id
        )
      `);

    if (providerId) {
      quotationsQuery.andWhere('pq.provider_id = :providerId', { providerId });
    }

    const quotations = await quotationsQuery
      .limit(limit)
      .offset(offset)
      .getMany();

    console.log('[AuditorService] Cotizaciones encontradas para auditoría:', quotations.length);

    // Formatear resultados
    const results = await Promise.all(quotations.map(async (quotation) => {
      // Obtener información del pedido médico
      const medicalOrder = await this.medicalOrderRepository.findOne({
        where: { order_id: quotation.request_id }
      });

      return {
        quotation_id: quotation.quotation_id,
        quotation_number: quotation.quotation_number,
        provider_id: quotation.provider_id,
        total_amount: quotation.total_amount,
        delivery_time_days: quotation.delivery_time_days,
        created_at: quotation.created_at,
        medical_order: medicalOrder ? {
          order_id: medicalOrder.order_id,
          order_number: medicalOrder.order_number,
          title: medicalOrder.title,
          estimated_cost: medicalOrder.estimated_cost,
          specialties: medicalOrder.specialties
        } : null
      };
    }));

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit)
      }
    };
  }

  // =============== SOLICITUDES AUDITADAS ===============

  async getAuditedRequests(userId: string, userRole: string, filters: {
    status?: string;
    auditorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, auditorId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    console.log('[AuditorService] Obteniendo solicitudes auditadas:', {
      userId,
      userRole,
      filters
    });

    const auditRequestsQuery = this.auditRequestRepository.createQueryBuilder('ar')
      .leftJoinAndSelect('ar.quotation', 'quotation')
      .leftJoinAndSelect('ar.medicalOrder', 'medicalOrder');

    if (status) {
      auditRequestsQuery.andWhere('ar.audit_status = :status', { status });
    }

    if (auditorId) {
      auditRequestsQuery.andWhere('ar.auditor_id = :auditorId', { auditorId });
    }

    const auditRequests = await auditRequestsQuery
      .orderBy('ar.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    console.log('[AuditorService] Solicitudes auditadas encontradas:', auditRequests.length);

    const results = auditRequests.map(auditRequest => ({
      audit_request_id: auditRequest.audit_request_id,
      quotation_id: auditRequest.quotation_id,
      medical_order_id: auditRequest.medical_order_id,
      provider_id: auditRequest.provider_id,
      audit_status: auditRequest.audit_status,
      auditor_notes: auditRequest.auditor_notes,
      rejection_reason: auditRequest.rejection_reason,
      original_order_cost: auditRequest.original_order_cost,
      quoted_cost: auditRequest.quoted_cost,
      approved_cost: auditRequest.approved_cost,
      audit_type: auditRequest.audit_type,
      auditor_id: auditRequest.auditor_id,
      audited_at: auditRequest.audited_at,
      created_at: auditRequest.created_at,
      quotation: auditRequest.quotation ? {
        quotation_number: auditRequest.quotation.quotation_number,
        total_amount: auditRequest.quotation.total_amount,
        delivery_time_days: auditRequest.quotation.delivery_time_days
      } : null,
      medical_order: auditRequest.medicalOrder ? {
        order_number: auditRequest.medicalOrder.order_number,
        title: auditRequest.medicalOrder.title,
        estimated_cost: auditRequest.medicalOrder.estimated_cost
      } : null
    }));

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit)
      }
    };
  }

  // =============== CREAR SOLICITUD DE AUDITORÍA ===============

  async createAuditRequest(createDto: CreateAuditRequestDto, userId: string) {
    console.log('[AuditorService] Creando solicitud de auditoría:', createDto);

    // Verificar que la cotización existe y está disponible para auditoría
    const quotation = await this.providerQuotationRepository.findOne({
      where: { quotation_id: createDto.quotation_id }
    });

    if (!quotation) {
      throw new NotFoundException('Cotización no encontrada');
    }

    if (!quotation.available_for_audit) {
      throw new BadRequestException('La cotización no está disponible para auditoría');
    }

    // Verificar que no existe ya una solicitud de auditoría para esta cotización
    const existingAudit = await this.auditRequestRepository.findOne({
      where: { quotation_id: createDto.quotation_id }
    });

    if (existingAudit) {
      throw new BadRequestException('Ya existe una solicitud de auditoría para esta cotización');
    }

    // Crear la solicitud de auditoría
    const auditRequest = this.auditRequestRepository.create({
      quotation_id: createDto.quotation_id,
      medical_order_id: createDto.medical_order_id,
      provider_id: createDto.provider_id,
      audit_status: 'pending',
      auditor_notes: createDto.auditor_notes,
      original_order_cost: createDto.original_order_cost,
      quoted_cost: createDto.quoted_cost,
      approved_cost: createDto.approved_cost,
      item_comparison: createDto.item_comparison,
      audit_criteria: createDto.audit_criteria,
      audit_type: createDto.audit_type || 'manual',
      created_by: userId
    });

    const savedAuditRequest = await this.auditRequestRepository.save(auditRequest);

    console.log('[AuditorService] Solicitud de auditoría creada:', savedAuditRequest.audit_request_id);

    return savedAuditRequest;
  }

  // =============== ACTUALIZAR SOLICITUD DE AUDITORÍA ===============

  async updateAuditRequest(auditRequestId: string, updateDto: UpdateAuditRequestDto, userId: string) {
    console.log('[AuditorService] Actualizando solicitud de auditoría:', auditRequestId);

    const auditRequest = await this.auditRequestRepository.findOne({
      where: { audit_request_id: auditRequestId }
    });

    if (!auditRequest) {
      throw new NotFoundException('Solicitud de auditoría no encontrada');
    }

    // Actualizar campos
    if (updateDto.audit_status !== undefined) {
      auditRequest.audit_status = updateDto.audit_status;
    }

    if (updateDto.auditor_notes !== undefined) {
      auditRequest.auditor_notes = updateDto.auditor_notes;
    }

    if (updateDto.rejection_reason !== undefined) {
      auditRequest.rejection_reason = updateDto.rejection_reason;
    }

    if (updateDto.approved_cost !== undefined) {
      auditRequest.approved_cost = updateDto.approved_cost;
    }

    if (updateDto.item_comparison !== undefined) {
      auditRequest.item_comparison = updateDto.item_comparison;
    }

    if (updateDto.audit_criteria !== undefined) {
      auditRequest.audit_criteria = updateDto.audit_criteria;
    }

    // Si se está aprobando o rechazando, marcar como auditada
    if (updateDto.audit_status === 'approved' || updateDto.audit_status === 'rejected') {
      auditRequest.auditor_id = userId;
      auditRequest.audited_at = new Date();
    }

    auditRequest.updated_by = userId;

    const updatedAuditRequest = await this.auditRequestRepository.save(auditRequest);

    console.log('[AuditorService] Solicitud de auditoría actualizada:', updatedAuditRequest.audit_request_id);

    return updatedAuditRequest;
  }

  // =============== OBTENER DETALLE DE AUDITORÍA ===============

  async getAuditRequestDetail(auditRequestId: string) {
    console.log('[AuditorService] Obteniendo detalle de auditoría:', auditRequestId);

    const auditRequest = await this.auditRequestRepository.findOne({
      where: { audit_request_id: auditRequestId },
      relations: ['quotation', 'medicalOrder']
    });

    if (!auditRequest) {
      throw new NotFoundException('Solicitud de auditoría no encontrada');
    }

    return auditRequest;
  }

  // =============== AUDITAR COTIZACIÓN DIRECTAMENTE ===============

  async auditQuotation(quotationId: string, auditDto: UpdateAuditRequestDto, userId: string) {
    console.log('[AuditorService] Auditando cotización:', quotationId);

    // Verificar que la cotización existe
    const quotation = await this.providerQuotationRepository.findOne({
      where: { quotation_id: quotationId }
    });

    if (!quotation) {
      throw new NotFoundException('Cotización no encontrada');
    }

    // Verificar que la cotización esté disponible para auditoría
    if (!quotation.available_for_audit) {
      throw new BadRequestException('Esta cotización no está disponible para auditoría');
    }

    // Buscar si ya existe una solicitud de auditoría para esta cotización
    let auditRequest = await this.auditRequestRepository.findOne({
      where: { quotation_id: quotationId }
    });

    // Si no existe, crear una nueva solicitud de auditoría
    if (!auditRequest) {
      auditRequest = this.auditRequestRepository.create({
        quotation_id: quotationId,
        medical_order_id: quotation.request_id,
        provider_id: quotation.provider_id,
        audit_status: 'pending',
        audit_type: 'manual',
        created_by: userId
      });
    }

    // Actualizar con los datos de auditoría
    if (auditDto.audit_status !== undefined) {
      auditRequest.audit_status = auditDto.audit_status;
    }

    if (auditDto.auditor_notes !== undefined) {
      auditRequest.auditor_notes = auditDto.auditor_notes;
    }

    if (auditDto.rejection_reason !== undefined) {
      auditRequest.rejection_reason = auditDto.rejection_reason;
    }

    if (auditDto.approved_cost !== undefined) {
      auditRequest.approved_cost = auditDto.approved_cost;
    }

    if (auditDto.audit_criteria !== undefined) {
      auditRequest.audit_criteria = auditDto.audit_criteria;
    }

    // Si se está aprobando o rechazando, marcar como auditada
    if (auditDto.audit_status === 'approved' || auditDto.audit_status === 'rejected') {
      auditRequest.auditor_id = userId;
      auditRequest.audited_at = new Date();
      auditRequest.completed_at = new Date();
    }

    auditRequest.updated_by = userId;

    // Guardar la solicitud de auditoría
    const savedAuditRequest = await this.auditRequestRepository.save(auditRequest);

    // Actualizar el estado de la cotización
    if (auditDto.audit_status === 'approved') {
      quotation.status = 'approved';
    } else if (auditDto.audit_status === 'rejected') {
      quotation.status = 'rejected';
    }

    quotation.available_for_audit = false;
    await this.providerQuotationRepository.save(quotation);

    console.log('[AuditorService] Cotización auditada exitosamente:', quotationId);

    return {
      success: true,
      data: savedAuditRequest,
      message: `Cotización ${auditDto.audit_status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`
    };
  }

  // =============== DETALLE DE COTIZACIÓN ===============

  async getQuotationDetail(quotationId: string) {
    console.log('[AuditorService] Obteniendo detalle de cotización:', quotationId);

    const quotation = await this.providerQuotationRepository.findOne({
      where: { quotation_id: quotationId },
      relations: ['items', 'attachments']
    });

    if (!quotation) {
      throw new NotFoundException('Cotización no encontrada');
    }

    // Obtener información del pedido médico
    const medicalOrder = await this.medicalOrderRepository.findOne({
      where: { order_id: quotation.request_id }
    });

    // Obtener información del proveedor
    const provider = await this.proveedorRepository.findOne({
      where: { providerId: quotation.provider_id }
    });

    // Obtener información del afiliado (paciente)
    let patientName = 'N/A';
    if (medicalOrder) {
      const affiliate = await this.affiliateRepository.findOne({
        where: { affiliate_id: medicalOrder.affiliate_id }
      });
      if (affiliate) {
        patientName = `${affiliate.firstName} ${affiliate.lastName}`;
      }
    }

    // Obtener información de los items con nombres y categorías
    const itemsWithDetails = await Promise.all(
      (quotation.items || []).map(async (item) => {
        const medicalOrderItem = await this.medicalOrderItemRepository.findOne({
          where: { item_id: item.request_item_id }
        });

        let categoryName = null;
        if (medicalOrderItem) {
          const category = await this.medicalCategoryRepository.findOne({
            where: { category_id: medicalOrderItem.category_id }
          });
          categoryName = category?.category_name || null;
        }

        return {
          item_id: item.quotation_item_id,
          name: medicalOrderItem?.item_name || item.request_item_id,
          description: item.observations,
          quantity: item.quantity,
          unit_cost: item.unit_price,
          total_cost: item.total_price,
          category: categoryName
        };
      })
    );

    // Obtener información de urgencia
    let urgency = 'medium';
    if (medicalOrder) {
      const urgencyType = await this.urgencyTypeRepository.findOne({
        where: { urgency_id: medicalOrder.urgency_id }
      });
      urgency = urgencyType?.urgency_name?.toLowerCase() || 'medium';
    }

    return {
      success: true,
      data: {
        quotation_id: quotation.quotation_id,
        medical_order_id: quotation.request_id,
        provider_id: quotation.provider_id,
        provider_name: provider?.providerName || quotation.provider_id,
        patient_name: patientName,
        total_cost: quotation.total_amount,
        delivery_days: quotation.delivery_time_days,
        items_count: quotation.items?.length || 0,
        status: quotation.status || 'pending',
        created_at: quotation.created_at,
        updated_at: quotation.updated_at,
        items: itemsWithDetails,
        medical_order: medicalOrder ? {
          medical_order_id: medicalOrder.order_id,
          patient_name: patientName,
          doctor_name: null, // TODO: Implementar obtención del doctor desde healthcare_provider
          specialty: medicalOrder.specialties,
          urgency: urgency,
          created_at: medicalOrder.created_at
        } : null
      }
    };
  }

  // =============== SOLICITUDES FINALIZADAS ===============

  async getCompletedRequests(userId: string, userRole: string, filters: {
    status?: string;
    provider_id?: string;
    date_from?: string;
    date_to?: string;
    patient_name?: string;
    medical_order_id?: string;
    page?: number;
    limit?: number;
  }) {
    const { 
      status, 
      provider_id, 
      date_from, 
      date_to, 
      patient_name, 
      medical_order_id, 
      page = 1, 
      limit = 10 
    } = filters;
    
    // Validar parámetros de paginación
    const validatedPage = Math.max(1, Math.min(page, 1000)); // Máximo 1000 páginas
    const validatedLimit = Math.max(1, Math.min(limit, 100)); // Máximo 100 elementos por página
    const offset = (validatedPage - 1) * validatedLimit;

    console.log('[AuditorService] Obteniendo solicitudes finalizadas:', {
      userId,
      userRole,
      filters
    });

    // Obtener solicitudes de auditoría completadas
    const auditRequestsQuery = this.auditRequestRepository.createQueryBuilder('ar')
      .leftJoinAndSelect('ar.quotation', 'quotation')
      .leftJoinAndSelect('ar.medicalOrder', 'medicalOrder')
      .where('ar.audit_status IN (:...statuses)', { 
        statuses: ['approved', 'rejected', 'completed'] 
      });

    if (status) {
      auditRequestsQuery.andWhere('ar.audit_status = :status', { status });
    }

    if (provider_id) {
      auditRequestsQuery.andWhere('ar.provider_id = :provider_id', { provider_id });
    }

    if (date_from) {
      auditRequestsQuery.andWhere('ar.completed_at >= :date_from', { date_from });
    }

    if (date_to) {
      auditRequestsQuery.andWhere('ar.completed_at <= :date_to', { date_to });
    }

    if (medical_order_id) {
      auditRequestsQuery.andWhere('ar.medical_order_id = :medical_order_id', { medical_order_id });
    }

    // Obtener total para paginación
    const total = await auditRequestsQuery.getCount();

    const auditRequests = await auditRequestsQuery
      .orderBy('ar.completed_at', 'DESC')
      .limit(validatedLimit)
      .offset(offset)
      .getMany();

    console.log('[AuditorService] Solicitudes finalizadas encontradas:', auditRequests.length);

    // Formatear resultados
    const results = auditRequests.map(auditRequest => ({
      audit_request_id: auditRequest.audit_request_id,
      quotation_id: auditRequest.quotation_id,
      medical_order_id: auditRequest.medical_order_id,
      provider_id: auditRequest.provider_id,
      audit_status: auditRequest.audit_status,
      auditor_notes: auditRequest.auditor_notes,
      rejection_reason: auditRequest.rejection_reason,
      original_order_cost: auditRequest.original_order_cost,
      quoted_cost: auditRequest.quoted_cost,
      approved_cost: auditRequest.approved_cost,
      audit_type: auditRequest.audit_type,
      auditor_id: auditRequest.auditor_id,
      audited_at: auditRequest.audited_at,
      completed_at: auditRequest.completed_at,
      created_at: auditRequest.created_at,
      quotation: auditRequest.quotation ? {
        quotation_number: auditRequest.quotation.quotation_number,
        total_amount: auditRequest.quotation.total_amount,
        delivery_time_days: auditRequest.quotation.delivery_time_days
      } : null,
      medical_order: auditRequest.medicalOrder ? {
        order_number: auditRequest.medicalOrder.order_number,
        title: auditRequest.medicalOrder.title,
        estimated_cost: auditRequest.medicalOrder.estimated_cost
      } : null
    }));

    return {
      success: true,
      data: {
        data: results,
        total,
        page: validatedPage,
        limit: validatedLimit,
        total_pages: Math.ceil(total / validatedLimit)
      }
    };
  }

  // =============== ESTADÍSTICAS DE AUDITORÍA ===============

  async getAuditStatistics(userId: string, userRole: string) {
    console.log('[AuditorService] Obteniendo estadísticas de auditoría');

    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      approvedRequests,
      rejectedRequests,
      completedRequests
    ] = await Promise.all([
      this.auditRequestRepository.count(),
      this.auditRequestRepository.count({ where: { audit_status: 'pending' } }),
      this.auditRequestRepository.count({ where: { audit_status: 'in_progress' } }),
      this.auditRequestRepository.count({ where: { audit_status: 'approved' } }),
      this.auditRequestRepository.count({ where: { audit_status: 'rejected' } }),
      this.auditRequestRepository.count({ where: { audit_status: 'completed' } })
    ]);

    // Calcular tiempo promedio de procesamiento (días)
    const averageProcessingTimeQuery = await this.auditRequestRepository
      .createQueryBuilder('ar')
      .select('AVG(EXTRACT(EPOCH FROM (ar.completed_at - ar.created_at)) / 86400)', 'avg_days')
      .where('ar.completed_at IS NOT NULL')
      .getRawOne();
    
    const averageProcessingTime = averageProcessingTimeQuery?.avg_days || 0;

    // Calcular ahorro de costos (diferencia entre costo original y aprobado)
    const costSavingsQuery = await this.auditRequestRepository
      .createQueryBuilder('ar')
      .select('SUM(COALESCE(ar.original_order_cost, 0) - COALESCE(ar.approved_cost, 0))', 'total_savings')
      .where('ar.audit_status = :status', { status: 'approved' })
      .andWhere('ar.original_order_cost IS NOT NULL')
      .andWhere('ar.approved_cost IS NOT NULL')
      .getRawOne();
    
    const costSavings = costSavingsQuery?.total_savings || 0;

    // Obtener tendencias mensuales de los últimos 6 meses
    const monthlyTrendsQuery = await this.auditRequestRepository
      .createQueryBuilder('ar')
      .select([
        'DATE_TRUNC(\'month\', ar.created_at) as month',
        'COUNT(*) as requests',
        'COUNT(CASE WHEN ar.audit_status = \'approved\' THEN 1 END) as approved',
        'COUNT(CASE WHEN ar.audit_status = \'rejected\' THEN 1 END) as rejected'
      ])
      .where('ar.created_at >= :sixMonthsAgo', { 
        sixMonthsAgo: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) 
      })
      .groupBy('DATE_TRUNC(\'month\', ar.created_at)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const monthlyTrends = monthlyTrendsQuery.map(trend => ({
      month: trend.month.toISOString().slice(0, 7), // YYYY-MM format
      requests: parseInt(trend.requests),
      approved: parseInt(trend.approved),
      rejected: parseInt(trend.rejected)
    }));

    return {
      success: true,
      data: {
        total_requests: totalRequests,
        pending_requests: pendingRequests,
        in_progress_requests: inProgressRequests,
        approved_requests: approvedRequests,
        rejected_requests: rejectedRequests,
        completed_requests: completedRequests,
        average_processing_time: averageProcessingTime,
        cost_savings: costSavings,
        monthly_trends: monthlyTrends
      }
    };
  }
} 