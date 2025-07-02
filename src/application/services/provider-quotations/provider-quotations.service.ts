import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProviderQuotationDto } from '../../../api/v1/provider-quotations/dtos/create-provider-quotation.dto';
import { UpdateProviderQuotationDto } from '../../../api/v1/provider-quotations/dtos/update-provider-quotation.dto';
import { AuditQuotationDto } from '../../../api/v1/provider-quotations/dtos/audit-quotation.dto';
import { ProviderQuotation } from '../../../domain/models/provider-quotation/provider-quotation.model';
import { QuotationAuditEntity, QuotationAuditRecommendationEntity, QuotationAuditRiskFactorEntity } from '../../../entities/quotation-audit.entity';
import { ProveedorEntity, EspecialidadEntity } from '../../../infrastructure/persistence/postgres/entities/proveedor.entity';
import { MedicalOrderTypeOrmEntity } from '../../../infrastructure/entities/medical-order.typeorm-entity';
import { EffectorRequestEntity } from '../../../infrastructure/entities/effector-request.entity';
import { randomUUID } from 'crypto';
import { IdObfuscatorUtil } from '../../../shared/utils/id-obfuscator.util';

@Injectable()
export class ProviderQuotationsService {
  constructor(
    @InjectRepository(ProveedorEntity)
    private readonly providerRepository: Repository<ProveedorEntity>,
    @InjectRepository(EspecialidadEntity)
    private readonly especialidadRepository: Repository<EspecialidadEntity>,
    @InjectRepository(MedicalOrderTypeOrmEntity)
    private readonly medicalOrderRepository: Repository<MedicalOrderTypeOrmEntity>,
    @InjectRepository(EffectorRequestEntity)
    private readonly effectorRequestRepository: Repository<EffectorRequestEntity>,
    @InjectRepository(QuotationAuditEntity)
    private readonly quotationAuditRepository: Repository<QuotationAuditEntity>
  ) {}

  // =============== SOLICITUDES A COTIZAR ===============

  async getAvailableRequests(
    userId: string,
    userRole: string,
    filters: {
      specialty?: string;
      type?: 'medical' | 'effector' | 'all';
      priority?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { specialty, type = 'all', priority, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Obtener las especialidades del proveedor (Administradores pueden ver todas)
    let providerSpecialties: string[] = [];
    let isAdmin = false;
    
    if (userRole === 'ADMIN' || userRole === 'Administrador') {
      isAdmin = true;
      // Los administradores pueden ver todas las especialidades
    } else if (userRole === 'PROVEEDOR' || userRole === 'Proveedor') {
      const provider = await this.providerRepository.findOne({
        where: { userId },
        relations: ['especialidades']
      });
      
      if (provider?.especialidades) {
        providerSpecialties = provider.especialidades.map(esp => esp.especialidadId);
      }
    }

    const results = [];

    // Obtener pedidos médicos disponibles
    if (type === 'all' || type === 'medical') {
      const medicalOrdersQuery = this.medicalOrderRepository.createQueryBuilder('mo')
        .where('mo.available_for_quotation = :available', { available: true })
        .andWhere('mo.authorization_status = :status', { status: 'approved' });

      // Filtrar por especialidades del proveedor (solo si no es admin)
      if (!isAdmin && providerSpecialties.length > 0) {
        medicalOrdersQuery.andWhere(
          'mo.specialties IS NOT NULL AND mo.specialties ?| array[:specialties]',
          { specialties: providerSpecialties }
        );
      }

      // Verificar que el proveedor no haya cotizado ya (solo para proveedores)
      if (!isAdmin) {
        medicalOrdersQuery.andWhere(`
          NOT EXISTS (
            SELECT 1 FROM provider_quotations pq 
            WHERE pq.request_id = mo.order_id 
            AND pq.provider_id = (
              SELECT provider_id FROM proveedores WHERE user_id = :userId
            )
          )
        `, { userId });
      }

      if (specialty) {
        medicalOrdersQuery.andWhere(
          'mo.specialties @> :specialtyArray',
          { specialtyArray: JSON.stringify([specialty]) }
        );
      }

      const medicalOrders = await medicalOrdersQuery
        .limit(limit)
        .offset(offset)
        .getMany();

      const medicalOrdersFormatted = medicalOrders.map(order => ({
        request_id: order.order_id,
        request_number: order.order_number,
        title: order.title,
        description: order.description,
        type: 'medical',
        specialties: order.specialties || [],
        urgency: order.urgency_id,
        estimated_cost: order.estimated_cost,
        created_at: order.created_at
      }));

      results.push(...medicalOrdersFormatted);
    }

    // Obtener pedidos de efectores disponibles
    if (type === 'all' || type === 'effector') {
      const effectorRequestsQuery = this.effectorRequestRepository.createQueryBuilder('er')
        .where('er.available_for_quotation = :available', { available: true })
        .innerJoin('effector_request_states', 'ers', 'ers.state_id = er.state_id')
        .andWhere('ers.state_name = :state', { state: 'APROBADO' });

      // Filtrar por especialidades del proveedor (solo si no es admin)
      if (!isAdmin && providerSpecialties.length > 0) {
        effectorRequestsQuery.andWhere(
          'er.specialties IS NOT NULL AND er.specialties ?| array[:specialties]',
          { specialties: providerSpecialties }
        );
      }

      // Verificar que el proveedor no haya cotizado ya (solo para proveedores)
      if (!isAdmin) {
        effectorRequestsQuery.andWhere(`
          NOT EXISTS (
            SELECT 1 FROM provider_quotations pq 
            WHERE pq.request_id = er.request_id 
            AND pq.provider_id = (
              SELECT provider_id FROM proveedores WHERE user_id = :userId
            )
          )
        `, { userId });
      }

      if (specialty) {
        effectorRequestsQuery.andWhere(
          'er.specialties @> :specialtyArray',
          { specialtyArray: JSON.stringify([specialty]) }
        );
      }

      if (priority) {
        effectorRequestsQuery.andWhere('er.priority = :priority', { priority });
      }

      const effectorRequests = await effectorRequestsQuery
        .limit(limit)
        .offset(offset)
        .getMany();

      const effectorRequestsFormatted = effectorRequests.map(request => ({
        request_id: request.request_id,
        request_number: request.request_number,
        title: request.title,
        description: request.description,
        type: 'effector',
        specialties: request.specialties || [],
        priority: request.priority,
        delivery_date: request.delivery_date,
        estimated_amount: request.total_estimated_amount,
        created_at: request.created_at
      }));

      results.push(...effectorRequestsFormatted);
    }

    // Ordenar por fecha de creación (más recientes primero)
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      data: results.slice(0, limit),
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit)
      }
    };
  }

  async getRequestDetail(requestId: string, userId: string, userRole: string) {
    console.log(`[ProviderQuotationsService] getRequestDetail called with:`);
    console.log(`  - requestId: ${requestId}`);
    console.log(`  - userId: ${userId}`);
    console.log(`  - userRole: ${userRole}`);
    
    // Desofuscar el requestId si es necesario
    const { id: deobfuscatedRequestId, isValid, wasObfuscated } = IdObfuscatorUtil.smartDeobfuscate(requestId);
    
    if (!isValid) {
      console.error(`[ProviderQuotationsService] Invalid requestId: ${requestId}`);
      throw new BadRequestException('ID de solicitud inválido');
    }
    
    if (wasObfuscated) {
      console.log(`[ProviderQuotationsService] Request ID deobfuscated: ${requestId} -> ${deobfuscatedRequestId}`);
    }
    
    // Usar el ID desofuscado para todas las operaciones
    const realRequestId = deobfuscatedRequestId;
    
    // Verificar permisos del usuario
    const isAdmin = userRole === 'ADMIN' || userRole === 'Administrador';
    console.log(`  - isAdmin: ${isAdmin}`);
    
    if (!isAdmin) {
      console.log(`[ProviderQuotationsService] User is not admin, checking provider...`);
      const provider = await this.providerRepository.findOne({
        where: { userId },
        relations: ['especialidades']
      });
      console.log(`[ProviderQuotationsService] Provider found: ${!!provider}`);

      if (!provider) {
        throw new ForbiddenException('Usuario no es un proveedor válido');
      }
    } else {
      console.log(`[ProviderQuotationsService] User is admin, skipping provider validation`);
    }

    const pool = (this.providerRepository as any).manager.connection;

    // Intentar encontrar en medical orders primero
    let requestQuery = `
      SELECT 
        mo.order_id as request_id,
        mo.order_number as request_number,
        mo.title,
        mo.description,
        'medical' as type,
        mo.specialties,
        ut.urgency_name as priority,
        ut.urgency_name as urgency,
        mo.estimated_cost,
        mo.created_at as delivery_date,
        mo.created_at,
        mos.state_name as status,
        mo.available_for_quotation,
        u.nombre as requester_name
      FROM medical_orders mo
      LEFT JOIN usuarios u ON mo.created_by = u.user_id
      LEFT JOIN urgency_types ut ON mo.urgency_id = ut.urgency_id
      LEFT JOIN medical_order_states mos ON mo.state_id = mos.state_id
      WHERE mo.order_id = $1 AND mo.available_for_quotation = true
    `;

    let result = await pool.query(requestQuery, [realRequestId]);

    if (result.length === 0) {
      // Intentar en effector requests
      requestQuery = `
        SELECT 
          er.request_id,
          er.request_number,
          er.title,
          er.description,
          'effector' as type,
          er.specialties,
          er.priority,
          er.priority as urgency,
          er.total_estimated_amount as estimated_cost,
          er.delivery_date,
          er.created_at,
          'ACTIVE' as status,
          er.available_for_quotation,
          u.nombre as requester_name
        FROM effector_requests er
        LEFT JOIN usuarios u ON er.effector_id = u.user_id
        WHERE er.request_id = $1 AND er.available_for_quotation = true
      `;

      result = await pool.query(requestQuery, [realRequestId]);
    }

    if (result.length === 0) {
      throw new NotFoundException('Pedido no encontrado o no disponible para cotización');
    }

    const request = result[0];

    // Obtener items del pedido
    let itemsQuery = '';
    if (request.type === 'medical') {
      itemsQuery = `
        SELECT 
          moi.item_id,
          moi.item_name,
          moi.item_description as description,
          moi.requested_quantity,
          moi.unit_of_measure as unit,
          moi.estimated_unit_cost,
          (moi.estimated_unit_cost * moi.requested_quantity) as total_estimated_cost,
          'normal' as urgency
        FROM medical_order_items moi
        WHERE moi.order_id = $1
        ORDER BY moi.created_at
      `;
    } else {
      itemsQuery = `
        SELECT 
          eri.item_id,
          eri.article_name as item_name,
          eri.description,
          eri.quantity as requested_quantity,
          eri.unit_measure as unit,
          eri.estimated_unit_price as estimated_unit_cost,
          eri.estimated_total_price as total_estimated_cost,
          'normal' as urgency
        FROM effector_request_items eri
        WHERE eri.request_id = $1
        ORDER BY eri.created_at
      `;
    }

    const items = await pool.query(itemsQuery, [realRequestId]);

    return {
      ...request,
      items
    };
  }

  async createQuotation(
    createDto: CreateProviderQuotationDto,
    userId: string,
    userRole: string
  ) {
    console.log(`[ProviderQuotationsService] Creating quotation for request: ${createDto.request_id}`);
    
    // Desofuscar el request_id si es necesario
    const { id: deobfuscatedRequestId, isValid, wasObfuscated } = IdObfuscatorUtil.smartDeobfuscate(createDto.request_id);
    
    if (!isValid) {
      console.error(`[ProviderQuotationsService] Invalid request_id: ${createDto.request_id}`);
      throw new BadRequestException('ID de solicitud inválido');
    }
    
    if (wasObfuscated) {
      console.log(`[ProviderQuotationsService] Request ID deobfuscated: ${createDto.request_id} -> ${deobfuscatedRequestId}`);
    }
    
    // Usar el ID desofuscado para todas las operaciones posteriores
    const requestId = deobfuscatedRequestId;
    
    // Obtener información del proveedor (solo para proveedores)
    let provider = null;
    let providerId = null;
    const isAdmin = userRole === 'ADMIN' || userRole === 'Administrador';
    
    if (!isAdmin) {
      provider = await this.providerRepository.findOne({
        where: { userId }
      });

      if (!provider) {
        throw new BadRequestException('Usuario no es un proveedor válido');
      }
      providerId = provider.providerId;
    } else {
      // Para administradores, usar un UUID especial fijo
      providerId = '00000000-0000-0000-0000-000000000001'; // UUID especial para administradores
      console.log('[ProviderQuotationsService] User is admin, using special admin provider_id');
    }

    // Verificar que el request existe en las tablas correspondientes
    const pool = (this.providerRepository as any).manager.connection;
    
    // Verificar si existe en effector_requests
    const effectorRequest = await pool.query(`
      SELECT request_id FROM effector_requests WHERE request_id = $1
    `, [requestId]);
    
    // Verificar si existe en medical_orders
    const medicalOrder = await pool.query(`
      SELECT order_id FROM medical_orders WHERE order_id = $1
    `, [requestId]);
    
    if (effectorRequest.length === 0 && medicalOrder.length === 0) {
      console.error(`[ProviderQuotationsService] Request not found in any table: ${requestId}`);
      throw new NotFoundException('La solicitud especificada no existe');
    }
    
    const requestType = effectorRequest.length > 0 ? 'effector_requests' : 'medical_orders';
    console.log(`[ProviderQuotationsService] Request found in: ${requestType}`);
    
    // Ahora soportamos tanto pedidos médicos como de efectores
    
    // Verificar que no exista una cotización previa para este pedido (solo para proveedores reales)
    if (!isAdmin) {
      const existingQuotation = await pool.query(`
        SELECT quotation_id FROM provider_quotations 
        WHERE request_id = $1 AND provider_id = $2
      `, [requestId, providerId]);

      if (existingQuotation.length > 0) {
        throw new ConflictException('El proveedor ya tiene una cotización para este pedido');
      }
    }

    // Generar número de cotización único
    const quotationNumber = `COT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calcular monto total
    const totalAmount = createDto.items.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity);
    }, 0);

    // Crear la cotización
    const quotationId = randomUUID();
    
    await pool.query(`
      INSERT INTO provider_quotations (
        quotation_id, request_id, provider_id, quotation_number,
        state_id, total_amount, delivery_time_days, delivery_terms,
        payment_terms, warranty_terms, observations, valid_until,
        created_by
      ) VALUES (
        $1, $2, $3, $4, 
        (SELECT state_id FROM quotation_states WHERE state_name = 'ENVIADA'),
        $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      quotationId,
      requestId,
      providerId,
      quotationNumber,
      totalAmount,
      createDto.delivery_time_days,
      createDto.delivery_terms,
      createDto.payment_terms,
      createDto.warranty_terms,
      createDto.observations,
      createDto.valid_until,
      userId
    ]);

    // Crear items de la cotización
    for (const item of createDto.items) {
      const itemId = randomUUID();
      const totalPrice = item.unit_price * item.quantity;

      await pool.query(`
        INSERT INTO provider_quotation_items (
          quotation_item_id, quotation_id, request_item_id,
          unit_price, total_price, quantity, delivery_time_days, observations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        itemId,
        quotationId,
        item.request_item_id,
        item.unit_price,
        totalPrice,
        item.quantity,
        item.delivery_time_days,
        item.observations
      ]);
    }

    return {
      quotation_id: quotationId,
      quotation_number: quotationNumber,
      status: 'ENVIADA',
      total_amount: totalAmount,
      message: 'Cotización creada exitosamente'
    };
  }

  // =============== MIS SOLICITUDES COTIZADAS ===============

  async getMyQuotations(
    userId: string,
    userRole: string,
    filters: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const provider = await this.providerRepository.findOne({
      where: { userId }
    });

    if (!provider && userRole !== 'ADMIN' && userRole !== 'Administrador') {
      throw new ForbiddenException('No tiene permisos para ver cotizaciones');
    }

    const pool = (this.providerRepository as any).manager.connection;
    
    let whereConditions = '';
    const queryParams: any[] = [limit, offset];
    let paramIndex = 3;

    // Filtro por proveedor (excepto admin)
    if (userRole !== 'ADMIN' && userRole !== 'Administrador') {
      whereConditions += ' AND pq.provider_id = $' + paramIndex++;
      queryParams.splice(-2, 0, provider.providerId);
    }

    if (status) {
      whereConditions += ' AND qs.state_name = $' + paramIndex++;
      queryParams.splice(-2, 0, status);
    }

    if (dateFrom) {
      whereConditions += ' AND pq.created_at >= $' + paramIndex++;
      queryParams.splice(-2, 0, dateFrom);
    }

    if (dateTo) {
      whereConditions += ' AND pq.created_at <= $' + paramIndex++;
      queryParams.splice(-2, 0, dateTo);
    }

    const query = `
      SELECT 
        pq.quotation_id,
        pq.quotation_number,
        pq.total_amount,
        pq.created_at,
        pq.valid_until,
        qs.state_name as status,
        -- Información de auditoría
        qa.decision as audit_decision,
        qa.approved_amount,
        qa.audit_notes,
        qa.created_at as audit_date,
        -- Información del request
        CASE 
          WHEN mo.order_id IS NOT NULL THEN 'medical'
          WHEN er.request_id IS NOT NULL THEN 'effector'
          ELSE 'unknown'
        END as request_type,
        COALESCE(mo.order_number, er.request_number) as request_number,
        COALESCE(mo.title, er.title) as request_title
      FROM provider_quotations pq
      JOIN quotation_states qs ON pq.state_id = qs.state_id
      LEFT JOIN quotation_audits qa ON pq.quotation_id = qa.quotation_id
      LEFT JOIN medical_orders mo ON pq.request_id = mo.order_id
      LEFT JOIN effector_requests er ON pq.request_id = er.request_id
      WHERE 1=1 ${whereConditions}
      ORDER BY pq.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, queryParams);

    return {
      data: result,
      pagination: {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit)
      }
    };
  }

  async getQuotationById(quotationId: string, userId: string, userRole: string) {
    const provider = await this.providerRepository.findOne({
      where: { userId }
    });

    const pool = (this.providerRepository as any).manager.connection;
    
    let whereCondition = 'WHERE pq.quotation_id = $1';
    const queryParams = [quotationId];

    // Los proveedores solo pueden ver sus propias cotizaciones
    if (userRole !== 'ADMIN' && userRole !== 'Administrador') {
      if (!provider) {
        throw new ForbiddenException('No tiene permisos para ver esta cotización');
      }
      whereCondition += ' AND pq.provider_id = $2';
      queryParams.push(provider.providerId);
    }

    const quotationQuery = `
      SELECT 
        pq.*,
        qs.state_name,
        pr.provider_name,
        -- Información de auditoría
        qa.decision as audit_decision,
        qa.approved_amount,
        qa.audit_notes,
        qa.ai_analysis_result,
        qa.created_at as audit_date,
        -- Información del request
        CASE 
          WHEN mo.order_id IS NOT NULL THEN 'medical'
          WHEN er.request_id IS NOT NULL THEN 'effector'
          ELSE 'unknown'
        END as request_type,
        COALESCE(mo.order_number, er.request_number) as request_number,
        COALESCE(mo.title, er.title) as request_title
      FROM provider_quotations pq
      JOIN quotation_states qs ON pq.state_id = qs.state_id
      JOIN proveedores pr ON pq.provider_id = pr.provider_id
      LEFT JOIN quotation_audits qa ON pq.quotation_id = qa.quotation_id
      LEFT JOIN medical_orders mo ON pq.request_id = mo.order_id
      LEFT JOIN effector_requests er ON pq.request_id = er.request_id
      ${whereCondition}
    `;

    const quotationResult = await pool.query(quotationQuery, queryParams);

    if (quotationResult.length === 0) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const quotation = quotationResult[0];

    // Obtener items de la cotización
    const itemsQuery = `
      SELECT 
        pqi.*,
        -- Información del item original del request
        CASE 
          WHEN moi.item_id IS NOT NULL THEN moi.item_name
          WHEN eri.item_id IS NOT NULL THEN eri.article_name
          ELSE 'Item no encontrado'
        END as item_name,
        CASE 
          WHEN moi.item_id IS NOT NULL THEN moi.requested_quantity
          WHEN eri.item_id IS NOT NULL THEN eri.quantity
          ELSE 0
        END as requested_quantity
      FROM provider_quotation_items pqi
      LEFT JOIN medical_order_items moi ON pqi.request_item_id = moi.item_id
      LEFT JOIN effector_request_items eri ON pqi.request_item_id = eri.item_id
      WHERE pqi.quotation_id = $1
      ORDER BY pqi.created_at
    `;

    const items = await pool.query(itemsQuery, [quotationId]);

    return {
      ...quotation,
      items
    };
  }

  async updateQuotation(
    quotationId: string,
    updateDto: UpdateProviderQuotationDto,
    userId: string,
    userRole: string
  ) {
    // Verificar que la cotización existe y pertenece al proveedor
    const quotation = await this.getQuotationById(quotationId, userId, userRole);

    // Verificar que no ha sido auditada
    if (quotation.audit_decision) {
      throw new ForbiddenException('No se puede actualizar una cotización ya auditada');
    }

    const pool = (this.providerRepository as any).manager.connection;

    // Actualizar cotización
    if (updateDto.items && updateDto.items.length > 0) {
      // Recalcular total
      const newTotalAmount = updateDto.items.reduce((sum, item) => {
        return sum + ((item.unit_price || 0) * (item.quantity || 0));
      }, 0);

      await pool.query(`
        UPDATE provider_quotations 
        SET 
          total_amount = $1,
          delivery_time_days = COALESCE($2, delivery_time_days),
          delivery_terms = COALESCE($3, delivery_terms),
          payment_terms = COALESCE($4, payment_terms),
          warranty_terms = COALESCE($5, warranty_terms),
          observations = COALESCE($6, observations),
          valid_until = COALESCE($7, valid_until),
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $8
        WHERE quotation_id = $9
      `, [
        newTotalAmount,
        updateDto.delivery_time_days,
        updateDto.delivery_terms,
        updateDto.payment_terms,
        updateDto.warranty_terms,
        updateDto.observations,
        updateDto.valid_until,
        userId,
        quotationId
      ]);

      // Actualizar items si se proporcionan
      for (const item of updateDto.items) {
        if (item.quotation_item_id) {
          // Actualizar item existente
          const totalPrice = (item.unit_price || 0) * (item.quantity || 0);
          await pool.query(`
            UPDATE provider_quotation_items 
            SET 
              unit_price = COALESCE($1, unit_price),
              quantity = COALESCE($2, quantity),
              total_price = $3,
              delivery_time_days = COALESCE($4, delivery_time_days),
              observations = COALESCE($5, observations)
            WHERE quotation_item_id = $6
          `, [
            item.unit_price,
            item.quantity,
            totalPrice,
            item.delivery_time_days,
            item.observations,
            item.quotation_item_id
          ]);
        }
      }
    }

    return this.getQuotationById(quotationId, userId, userRole);
  }

  async deleteQuotation(quotationId: string, userId: string, userRole: string) {
    // Verificar que la cotización existe y pertenece al proveedor
    const quotation = await this.getQuotationById(quotationId, userId, userRole);

    // Verificar que no ha sido auditada
    if (quotation.audit_decision) {
      throw new ForbiddenException('No se puede eliminar una cotización ya auditada');
    }

    const pool = (this.providerRepository as any).manager.connection;

    // Eliminar items primero (por referencia de FK)
    await pool.query('DELETE FROM provider_quotation_items WHERE quotation_id = $1', [quotationId]);
    
    // Eliminar cotización
    await pool.query('DELETE FROM provider_quotations WHERE quotation_id = $1', [quotationId]);

    return { message: 'Cotización eliminada exitosamente' };
  }

  // =============== SOLICITUDES PROCESADAS POR AUDITORES ===============

  async getAuditedQuotations(
    userId: string,
    userRole: string,
    filters: {
      auditResult?: string;
      auditorId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { auditResult, auditorId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const provider = await this.providerRepository.findOne({
      where: { userId }
    });

    if (!provider && userRole !== 'ADMIN' && userRole !== 'Administrador') {
      throw new ForbiddenException('No tiene permisos para ver cotizaciones auditadas');
    }

    const pool = (this.providerRepository as any).manager.connection;
    
    let whereConditions = 'WHERE qa.audit_id IS NOT NULL';
    const queryParams: any[] = [limit, offset];
    let paramIndex = 3;

    // Filtro por proveedor (excepto admin)
    if (userRole !== 'ADMIN' && userRole !== 'Administrador') {
      whereConditions += ' AND pq.provider_id = $' + paramIndex++;
      queryParams.splice(-2, 0, provider.providerId);
    }

    if (auditResult) {
      // Mapear valores del frontend a los valores de la base de datos
      const mappedAuditResult = auditResult.toLowerCase();
      whereConditions += ' AND qa.decision = $' + paramIndex++;
      queryParams.splice(-2, 0, mappedAuditResult);
    }

    if (auditorId && (userRole === 'ADMIN' || userRole === 'Administrador')) {
      // Desofuscar auditorId si está ofuscado
      const { id: deobfuscatedAuditorId, isValid } = IdObfuscatorUtil.smartDeobfuscate(auditorId);
      console.log(`[ProviderQuotationsService] AuditorId: ${auditorId} -> ${deobfuscatedAuditorId}`);
      
      if (isValid) {
        whereConditions += ' AND qa.audited_by = $' + paramIndex++;
        queryParams.splice(-2, 0, deobfuscatedAuditorId);
      }
    }

    const query = `
      SELECT 
        pq.quotation_id,
        pq.quotation_number,
        pq.total_amount,
        pq.created_at,
        -- Mapear estados de auditoría al formato que espera el frontend
        CASE 
          WHEN qa.decision = 'approved' THEN 'APPROVED'
          WHEN qa.decision = 'rejected' THEN 'REJECTED'
          WHEN qa.decision = 'partial' THEN 'PARTIAL'
          ELSE 'PENDING'
        END as audit_status,
        qa.decision as audit_decision,
        qa.approved_amount,
        qa.audit_notes,
        qa.created_at as audited_at,
        -- Información del auditor
        u_auditor.nombre as audited_by,
        -- Información del proveedor
        COALESCE(pr.provider_name, 'Sistema') as provider_name,
        -- Información del request
        CASE 
          WHEN mo.order_id IS NOT NULL THEN 'medical'
          WHEN er.request_id IS NOT NULL THEN 'effector'
          ELSE 'unknown'
        END as request_type,
        COALESCE(mo.order_number, er.request_number) as request_number,
        COALESCE(mo.title, er.title) as request_title
      FROM provider_quotations pq
      JOIN quotation_states qs ON pq.state_id = qs.state_id
      INNER JOIN quotation_audits qa ON pq.quotation_id = qa.quotation_id
      LEFT JOIN usuarios u_auditor ON qa.audited_by = u_auditor.user_id
      LEFT JOIN proveedores pr ON pq.provider_id = pr.provider_id
      LEFT JOIN medical_orders mo ON pq.request_id = mo.order_id
      LEFT JOIN effector_requests er ON pq.request_id = er.request_id
      ${whereConditions}
      ORDER BY qa.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, queryParams);

    return {
      data: result,
      pagination: {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit)
      }
    };
  }

  // =============== AUDITORÍA ===============

  async auditQuotation(quotationId: string, auditDto: AuditQuotationDto, auditorId: string) {
    const pool = (this.providerRepository as any).manager.connection;

    // Verificar que la cotización existe
    const quotationResult = await pool.query(
      'SELECT * FROM provider_quotations WHERE quotation_id = $1',
      [quotationId]
    );

    if (quotationResult.length === 0) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const quotation = quotationResult[0];

    // Crear auditoría
    const auditId = randomUUID();
    await pool.query(`
      INSERT INTO quotation_audits (
        audit_id, quotation_id, audited_by, audit_type, decision,
        audit_notes, approved_amount, original_amount
      ) VALUES ($1, $2, $3, 'manual', $4, $5, $6, $7)
    `, [
      auditId,
      quotationId,
      auditorId,
      auditDto.decision,
      auditDto.audit_notes,
      auditDto.approved_total_amount || quotation.total_amount,
      quotation.total_amount
    ]);

    // Procesar recomendaciones si las hay
    if (auditDto.recommendations && auditDto.recommendations.length > 0) {
      for (const recommendation of auditDto.recommendations) {
        await pool.query(`
          INSERT INTO quotation_audit_recommendations (
            recommendation_id, audit_id, recommendation_type, description, priority
          ) VALUES ($1, $2, 'general', $3, 'medium')
        `, [randomUUID(), auditId, recommendation]);
      }
    }

    // Procesar factores de riesgo si los hay
    if (auditDto.risk_factors && auditDto.risk_factors.length > 0) {
      for (const riskFactor of auditDto.risk_factors) {
        await pool.query(`
          INSERT INTO quotation_audit_risk_factors (
            risk_factor_id, audit_id, risk_type, description, severity, probability
          ) VALUES ($1, $2, 'general', $3, $4, 50.0)
        `, [randomUUID(), auditId, riskFactor, auditDto.risk_level || 'medium']);
      }
    }

    // Actualizar estado de la cotización según la decisión
    let newStateQuery;
    switch (auditDto.decision) {
      case 'approved':
        newStateQuery = "SELECT state_id FROM quotation_states WHERE state_name = 'ACEPTADA'";
        break;
      case 'rejected':
        newStateQuery = "SELECT state_id FROM quotation_states WHERE state_name = 'RECHAZADA'";
        break;
      case 'partial':
        newStateQuery = "SELECT state_id FROM quotation_states WHERE state_name = 'ACEPTADA'";
        break;
      default:
        newStateQuery = "SELECT state_id FROM quotation_states WHERE state_name = 'ENVIADA'";
    }

    const newStateResult = await pool.query(newStateQuery);
    if (newStateResult.length > 0) {
      await pool.query(
        'UPDATE provider_quotations SET state_id = $1 WHERE quotation_id = $2',
        [newStateResult[0].state_id, quotationId]
      );
    }

    return {
      audit_id: auditId,
      quotation_id: quotationId,
      decision: auditDto.decision,
      message: 'Auditoría realizada exitosamente'
    };
  }

  async aiAuditQuotation(quotationId: string, auditorId: string) {
    const pool = (this.providerRepository as any).manager.connection;

    // Verificar que la cotización existe
    const quotationResult = await pool.query(
      'SELECT * FROM provider_quotations WHERE quotation_id = $1',
      [quotationId]
    );

    if (quotationResult.length === 0) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const quotation = quotationResult[0];

    // Simular análisis de IA (aquí se integraría con OpenAI como en el sistema de medicamentos)
    const aiAnalysis = {
      decision: 'approved',
      confidence_score: 0.85,
      reasoning: 'Análisis automático: Precios dentro del rango de mercado, proveedor confiable',
      price_analysis: {
        competitiveness: 'good',
        market_comparison: 'within_range'
      },
      risk_assessment: {
        overall_risk: 'low',
        financial_risk: 'low',
        delivery_risk: 'low'
      }
    };

    // Crear auditoría IA
    const auditId = randomUUID();
    await pool.query(`
      INSERT INTO quotation_audits (
        audit_id, quotation_id, audited_by, audit_type, decision,
        ai_analysis_result, ai_confidence_score, ai_reasoning,
        approved_amount, original_amount
      ) VALUES ($1, $2, $3, 'automatic', $4, $5, $6, $7, $8, $9)
    `, [
      auditId,
      quotationId,
      auditorId,
      aiAnalysis.decision,
      JSON.stringify(aiAnalysis),
      aiAnalysis.confidence_score,
      aiAnalysis.reasoning,
      quotation.total_amount,
      quotation.total_amount
    ]);

    return {
      audit_id: auditId,
      quotation_id: quotationId,
      ai_analysis: aiAnalysis,
      message: 'Auditoría automática completada'
    };
  }

  // =============== ESTADÍSTICAS ===============

  async getProviderDashboardStats(userId: string, userRole: string) {
    const provider = await this.providerRepository.findOne({
      where: { userId }
    });

    if (!provider) {
      throw new BadRequestException('Usuario no es un proveedor válido');
    }

    const pool = (this.providerRepository as any).manager.connection;

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN qs.state_name = 'ENVIADA' THEN 1 END) as pending_quotations,
        COUNT(CASE WHEN qs.state_name = 'ACEPTADA' THEN 1 END) as approved_quotations,
        COUNT(CASE WHEN qs.state_name = 'RECHAZADA' THEN 1 END) as rejected_quotations,
        COALESCE(SUM(pq.total_amount), 0) as total_quoted_amount,
        COALESCE(SUM(CASE WHEN qs.state_name = 'ACEPTADA' THEN pq.total_amount ELSE 0 END), 0) as approved_amount
      FROM provider_quotations pq
      JOIN quotation_states qs ON pq.state_id = qs.state_id
      WHERE pq.provider_id = $1
    `, [provider.providerId]);

    const availableRequests = await this.getAvailableRequests(userId, userRole, { page: 1, limit: 1 });

    return {
      ...stats[0],
      available_requests_count: availableRequests.pagination.total
    };
  }
} 