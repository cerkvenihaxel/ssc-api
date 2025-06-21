import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalOrderTypeOrmEntity, MedicalOrderItemTypeOrmEntity } from '../../../infrastructure/entities/medical-order.typeorm-entity';
import { CreateMedicalOrderDto, UpdateMedicalOrderDto, AuthorizeOrderDto, MedicalOrderQueryDto, MedicalOrderResponseDto, MedicalOrderListResponseDto, CorrectMedicalOrderDto, ItemCorrectionDto, RequesterType } from '../../../api/dtos/medical-order.dto';
import { OpenAIAuthorizationService } from '../../../infrastructure/services/openai-authorization.service';
import { IAfiliadoRepository } from '../../../domain/repositories/afiliado/afiliado.repository';
import { AiAnalysisPersistenceService, AIAnalysisResult } from './ai-analysis-persistence.service';

@Injectable()
export class MedicalOrdersService {
  constructor(
    @InjectRepository(MedicalOrderTypeOrmEntity)
    private readonly medicalOrderRepository: Repository<MedicalOrderTypeOrmEntity>,
    
    @InjectRepository(MedicalOrderItemTypeOrmEntity)
    private readonly medicalOrderItemRepository: Repository<MedicalOrderItemTypeOrmEntity>,
    
    @Inject('IAfiliadoRepository')
    private readonly afiliadoRepository: IAfiliadoRepository,
    
    private readonly openAIService: OpenAIAuthorizationService,
    private readonly aiPersistenceService: AiAnalysisPersistenceService,
  ) {}

  // Mock temporal para testing - evita consultas a la base de datos hasta que esté configurada
  private mockOrders = [
    {
      orderId: '1',
      orderNumber: 'MO-2024-000001',
      requesterId: 'user-1',
             requesterType: 'admin' as any,
      requesterName: 'Administrador',
      affiliateId: 'affiliate-1',
      affiliateName: 'Juan Pérez',
      affiliateNumber: 'AF001',
      healthcareProviderName: 'OSDE',
      state: { id: 2, name: 'Pendiente', description: 'Pendiente', isFinal: false },
      urgency: { id: 2, name: 'Normal', description: 'Normal', priorityLevel: 2, colorCode: '#3B82F6' },
      title: 'Pedido de prueba',
      description: 'Descripción de prueba',
      medicalJustification: 'Justificación médica',
      diagnosis: 'Diagnóstico',
      treatmentPlan: 'Plan de tratamiento',
      estimatedDurationDays: 7,
      items: [],
      hasAttachments: false,
      attachmentCount: 0,
      estimatedCost: 1000,
      approvedCost: null,
      rejectionReason: null,
      authorizationStatus: 'pending',
      authorizationType: 'automatic',
      authorizedBy: null,
      authorizedAt: null,
      authorizationNotes: null,
      aiAnalysisResult: null,
      aiConfidenceScore: null,
      aiAnalyzedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: { totalItems: 0, approvedItems: 0, rejectedItems: 0, pendingItems: 0 }
    }
  ];

  async createMedicalOrder(
    createDto: CreateMedicalOrderDto, 
    userId: string, 
    requesterType: 'admin' | 'doctor' | 'auditor'
  ): Promise<MedicalOrderResponseDto> {
    try {
      // Crear el pedido médico en la base de datos
      const medicalOrder = this.medicalOrderRepository.create({
        requester_id: userId,
        requester_type: requesterType,
        affiliate_id: createDto.affiliateId,
        healthcare_provider_id: createDto.healthcareProviderId,
        state_id: 2, // Pendiente
        urgency_id: createDto.urgencyId,
        title: createDto.title,
        description: createDto.description,
        medical_justification: createDto.medicalJustification,
        diagnosis: createDto.diagnosis,
        treatment_plan: createDto.treatmentPlan,
        estimated_duration_days: createDto.estimatedDurationDays,
        has_attachments: createDto.hasAttachments || false,
        estimated_cost: createDto.estimatedCost,
        authorization_type: createDto.authorizationType,
        authorization_status: 'pending',
        created_by: userId
      });

      const savedOrder = await this.medicalOrderRepository.save(medicalOrder);

      // Crear los items del pedido
      if (createDto.items && createDto.items.length > 0) {
        const orderItems = createDto.items.map(item => 
          this.medicalOrderItemRepository.create({
            order_id: savedOrder.order_id,
            category_id: item.categoryId,
            item_type: item.itemType,
            item_name: item.itemName,
            item_code: item.itemCode,
            item_description: item.itemDescription,
            requested_quantity: item.requestedQuantity,
            unit_of_measure: item.unitOfMeasure,
            brand: item.brand,
            presentation: item.presentation,
            concentration: item.concentration,
            administration_route: item.administrationRoute,
            medical_justification: item.medicalJustification,
            estimated_unit_cost: item.estimatedUnitCost,
            item_status: 'pending'
          })
        );

        await this.medicalOrderItemRepository.save(orderItems);
      }

      // Devolver el pedido completo
      return this.getMedicalOrderById(savedOrder.order_id);
    } catch (error) {
      throw new BadRequestException(`Error al crear el pedido médico: ${error.message}`);
    }
  }

  async getMedicalOrders(query: MedicalOrderQueryDto): Promise<MedicalOrderListResponseDto> {
    try {
      console.log('🔍 Iniciando getMedicalOrders con consulta SQL optimizada');
      
      const page = query.page || 1;
      const limit = query.limit || 10;
      const offset = (page - 1) * limit;

      // Consulta SQL con JOINs para obtener toda la información de una vez
      // Usando los nombres de columnas exactos según las entidades encontradas
      const sqlQuery = `
        SELECT 
          mo.order_id,
          mo.order_number,
          mo.requester_id,
          mo.requester_type,
          mo.affiliate_id,
          mo.healthcare_provider_id,
          mo.state_id,
          mo.urgency_id,
          mo.title,
          mo.description,
          mo.medical_justification,
          mo.diagnosis,
          mo.treatment_plan,
          mo.estimated_duration_days,
          mo.has_attachments,
          mo.estimated_cost,
          mo.approved_cost,
          mo.rejection_reason,
          mo.authorization_status,
          mo.authorization_type,
          mo.authorized_by,
          mo.authorized_at,
          mo.authorization_notes,
          mo.ai_analysis_result,
          mo.ai_confidence_score,
          mo.ai_analyzed_at,
          mo.created_at,
          mo.updated_at,
          -- Información del usuario solicitante (tabla usuarios)
          u.nombre as requester_name,
          -- Información del afiliado (tabla afiliados)
          a.first_name as affiliate_first_name,
          a.last_name as affiliate_last_name,
          a.affiliate_number,
          -- Información de la obra social (tabla obras_sociales)
          os.name as healthcare_provider_name
        FROM medical_orders mo
        LEFT JOIN usuarios u ON mo.requester_id = u.user_id
        LEFT JOIN afiliados a ON mo.affiliate_id = a.affiliate_id
        LEFT JOIN obras_sociales os ON mo.healthcare_provider_id = os.healthcare_provider_id
        ORDER BY mo.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM medical_orders mo
      `;

      console.log('📊 Ejecutando consultas con nombres de columnas corregidos...');
      const [ordersResult, countResult] = await Promise.all([
        this.medicalOrderRepository.query(sqlQuery, [limit, offset]),
        this.medicalOrderRepository.query(countQuery)
      ]);

      const orders = ordersResult;
      const total = parseInt(countResult[0].total);

      console.log(`📊 Encontrados ${orders.length} pedidos de un total de ${total}`);

      if (orders.length === 0) {
        console.log('📝 No hay pedidos en la base de datos');
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          stats: {
            totalOrders: 0,
            pendingOrders: 0,
            approvedOrders: 0,
            rejectedOrders: 0,
            totalEstimatedCost: 0,
            totalApprovedCost: 0
          }
        };
      }

      // Transformar datos usando la información obtenida del JOIN
      const transformedOrders: MedicalOrderResponseDto[] = orders.map((order) => {
        const requesterName = order.requester_name || 'Usuario';
        const affiliateName = order.affiliate_first_name && order.affiliate_last_name 
          ? `${order.affiliate_first_name} ${order.affiliate_last_name}`.trim()
          : 'Afiliado';
        const affiliateNumber = order.affiliate_number || 'N/A';
        const healthcareProviderName = order.healthcare_provider_name || 'Obra Social';

        console.log(`✅ Procesando pedido ${order.order_number}:`, {
          requesterName,
          affiliateName,
          healthcareProviderName,
          rawData: {
            requester_name: order.requester_name,
            affiliate_first_name: order.affiliate_first_name,
            affiliate_last_name: order.affiliate_last_name,
            healthcare_provider_name: order.healthcare_provider_name
          }
        });

        return {
          orderId: order.order_id,
          orderNumber: order.order_number || `MO-${order.order_id.slice(-8)}`,
          requesterId: order.requester_id,
          requesterType: order.requester_type as RequesterType,
          requesterName: requesterName,
          affiliateId: order.affiliate_id,
          affiliateName: affiliateName,
          affiliateNumber: affiliateNumber,
          healthcareProviderName: healthcareProviderName,
          state: {
            id: order.state_id,
            name: this.getStateName(order.state_id),
            description: this.getStateName(order.state_id),
            isFinal: order.state_id >= 4
          },
          urgency: {
            id: order.urgency_id,
            name: this.getUrgencyName(order.urgency_id),
            description: this.getUrgencyName(order.urgency_id),
            priorityLevel: order.urgency_id,
            colorCode: this.getUrgencyColor(order.urgency_id)
          },
          title: order.title,
          description: order.description,
          medicalJustification: order.medical_justification,
          diagnosis: order.diagnosis,
          treatmentPlan: order.treatment_plan,
          estimatedDurationDays: order.estimated_duration_days,
          items: [],
          hasAttachments: order.has_attachments || false,
          attachmentCount: 0,
          estimatedCost: parseFloat(order.estimated_cost?.toString() || '0'),
          approvedCost: order.approved_cost ? parseFloat(order.approved_cost.toString()) : null,
          rejectionReason: order.rejection_reason,
          authorizationStatus: order.authorization_status,
          authorizationType: order.authorization_type,
          authorizedBy: order.authorized_by,
          authorizedAt: order.authorized_at,
          authorizationNotes: order.authorization_notes,
          aiAnalysisResult: order.ai_analysis_result,
          aiConfidenceScore: order.ai_confidence_score ? parseFloat(order.ai_confidence_score.toString()) : null,
          aiAnalyzedAt: order.ai_analyzed_at,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          stats: {
            totalItems: 0,
            approvedItems: 0,
            rejectedItems: 0,
            pendingItems: 0
          }
        };
      });

      // Calcular estadísticas reales
      const stats = {
        totalOrders: total,
        pendingOrders: orders.filter(o => o.authorization_status === 'pending').length,
        approvedOrders: orders.filter(o => o.authorization_status === 'approved').length,
        rejectedOrders: orders.filter(o => o.authorization_status === 'rejected').length,
        totalEstimatedCost: orders.reduce((sum, o) => sum + (parseFloat(o.estimated_cost?.toString() || '0')), 0),
        totalApprovedCost: orders.reduce((sum, o) => sum + (parseFloat(o.approved_cost?.toString() || '0')), 0)
      };

      console.log('✅ getMedicalOrders completado exitosamente con datos reales');

      return {
        data: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats
      };
    } catch (error) {
      console.error('❌ Error en getMedicalOrders:', error);
      console.error('Stack trace:', error.stack);
      throw new BadRequestException(`Error al obtener pedidos médicos: ${error.message}`);
    }
  }

  async getMedicalOrderById(id: string): Promise<MedicalOrderResponseDto> {
    try {
      console.log(`🔍 Obteniendo detalles del pedido ${id}`);
      
      // Usar consulta SQL con JOINs para obtener toda la información de una vez
      const sqlQuery = `
        SELECT 
          mo.order_id,
          mo.order_number,
          mo.requester_id,
          mo.requester_type,
          mo.affiliate_id,
          mo.healthcare_provider_id,
          mo.state_id,
          mo.urgency_id,
          mo.title,
          mo.description,
          mo.medical_justification,
          mo.diagnosis,
          mo.treatment_plan,
          mo.estimated_duration_days,
          mo.has_attachments,
          mo.estimated_cost,
          mo.approved_cost,
          mo.rejection_reason,
          mo.authorization_status,
          mo.authorization_type,
          mo.authorized_by,
          mo.authorized_at,
          mo.authorization_notes,
          mo.ai_analysis_result,
          mo.ai_confidence_score,
          mo.ai_analyzed_at,
          mo.created_at,
          mo.updated_at,
          -- Información del usuario solicitante (tabla usuarios)
          u.nombre as requester_name,
          -- Información del afiliado (tabla afiliados)
          a.first_name as affiliate_first_name,
          a.last_name as affiliate_last_name,
          a.affiliate_number,
          -- Información de la obra social (tabla obras_sociales)
          os.name as healthcare_provider_name
        FROM medical_orders mo
        LEFT JOIN usuarios u ON mo.requester_id = u.user_id
        LEFT JOIN afiliados a ON mo.affiliate_id = a.affiliate_id
        LEFT JOIN obras_sociales os ON mo.healthcare_provider_id = os.healthcare_provider_id
        WHERE mo.order_id = $1
      `;

      console.log('📊 Ejecutando consulta para obtener detalles del pedido...');
      const orderResult = await this.medicalOrderRepository.query(sqlQuery, [id]);

      if (!orderResult || orderResult.length === 0) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      const order = orderResult[0];
      console.log(`✅ Pedido encontrado: ${order.order_number}`, {
        requester_name: order.requester_name,
        affiliate_first_name: order.affiliate_first_name,
        affiliate_last_name: order.affiliate_last_name,
        healthcare_provider_name: order.healthcare_provider_name
      });

      // Cargar los items del pedido con análisis de IA detallado
      const itemsQuery = `
        SELECT 
          moi.*,
          aia.ai_reasoning,
          aia.item_decision as ai_decision,
          aia.approved_quantity as ai_approved_quantity,
          aia.rejection_reasoning,
          aia.medical_appropriateness_score,
          aia.dosage_appropriateness_score,
          aia.cost_effectiveness_score,
          aia.has_drug_interaction,
          aia.has_dosage_concern,
          aia.has_medical_inconsistency,
          aia.has_cost_concern
        FROM medical_order_items moi
        LEFT JOIN ai_item_analyses aia ON moi.item_id = aia.medical_order_item_id
        WHERE moi.order_id = $1
        ORDER BY moi.created_at
      `;

      const items = await this.medicalOrderRepository.query(itemsQuery, [id]);
      console.log(`📦 Encontrados ${items.length} items para el pedido`);

      // Obtener análisis de IA completo de las nuevas tablas si existe
      let enhancedAiAnalysis = null;
      try {
        enhancedAiAnalysis = await this.aiPersistenceService.getLatestAnalysis(id);
        console.log('🤖 Análisis de IA encontrado en nuevas tablas:', enhancedAiAnalysis?.decision);
      } catch (error) {
        console.log('ℹ️ No se encontró análisis en nuevas tablas, usando formato legacy');
      }

      return this.mapToResponseDto(order, items, true, enhancedAiAnalysis);
    } catch (error) {
      console.error(`❌ Error obteniendo pedido ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener el pedido médico: ${error.message}`);
    }
  }

  async updateMedicalOrder(id: string, updateDto: UpdateMedicalOrderDto, userId: string): Promise<MedicalOrderResponseDto> {
    try {
      const order = await this.medicalOrderRepository.findOne({ where: { order_id: id } });
      
      if (!order) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      Object.assign(order, {
        ...updateDto,
        urgency_id: updateDto.urgencyId,
        updated_by: userId
      });

      await this.medicalOrderRepository.save(order);
      return this.getMedicalOrderById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al actualizar el pedido médico: ${error.message}`);
    }
  }

  async deleteMedicalOrder(id: string, userId?: string): Promise<void> {
    try {
      console.log(`🗑️ Intentando eliminar pedido médico: ${id}`);
      
      const order = await this.medicalOrderRepository.findOne({ where: { order_id: id } });
      
      if (!order) {
        console.log(`❌ Pedido no encontrado: ${id}`);
        throw new NotFoundException('Pedido médico no encontrado');
      }

      console.log(`📋 Pedido encontrado: ${order.order_number}, Estado: ${order.state_id}`);

      // Verificar si el pedido puede ser eliminado
      if (order.state_id >= 4) {
        console.log(`❌ No se puede eliminar pedido en estado: ${order.state_id}`);
        throw new BadRequestException('No se puede eliminar un pedido que ya ha sido procesado (autorizado, rechazado, etc.)');
      }

      console.log('🗑️ Eliminando items del pedido...');
      // Eliminar los items del pedido primero
      await this.medicalOrderItemRepository.delete({ order_id: id });
      
      console.log('🗑️ Eliminando pedido...');
      // Eliminar el pedido
      await this.medicalOrderRepository.delete({ order_id: id });
      
      console.log('✅ Pedido eliminado exitosamente');
      
      // Intentar registrar evento en el historial (no crítico si falla)
      try {
        await this.recordHistoryEvent(id, {
          action: 'DELETED',
          performedBy: userId || 'system',
          notes: 'Pedido médico eliminado',
          details: {
            orderNumber: order.order_number,
            previousState: order.state_id
          }
        });
        console.log('📝 Evento registrado en historial');
      } catch (historyError) {
        console.warn('⚠️ No se pudo registrar el evento de eliminación:', historyError.message);
      }
      
    } catch (error) {
      console.error(`❌ Error eliminando pedido ${id}:`, error.message);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al eliminar el pedido médico: ${error.message}`);
    }
  }

  async authorizeMedicalOrder(id: string, authorizeDto: AuthorizeOrderDto, userId: string): Promise<MedicalOrderResponseDto> {
    try {
      console.log(`🔍 Autorizando pedido médico ${id} como ${authorizeDto.decision}`);
      
      const order = await this.medicalOrderRepository.findOne({
        where: { order_id: id }
      });

      if (!order) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      console.log(`📋 Pedido encontrado:`, {
        orderId: order.order_id,
        orderNumber: order.order_number,
        currentStatus: order.authorization_status
      });

      const decision = authorizeDto.decision;
      order.authorization_status = decision === 'approved' ? 'approved' : 
                                  decision === 'rejected' ? 'rejected' : 'partial';
      order.authorized_by = userId;
      order.authorized_at = new Date();
      order.authorization_notes = authorizeDto.notes;
      order.rejection_reason = authorizeDto.rejectionReason;
      order.authorization_type = 'manual';

      if (decision === 'rejected') {
        order.state_id = 5;
      } else if (decision === 'approved') {
        order.state_id = 4;
      } else {
        order.state_id = 6;
      }

      console.log(`💾 Guardando cambios:`, {
        authorization_status: order.authorization_status,
        state_id: order.state_id,
        authorized_by: order.authorized_by
      });

      await this.medicalOrderRepository.save(order);

      if (authorizeDto.itemApprovals && authorizeDto.itemApprovals.length > 0) {
        console.log(`📦 Actualizando ${authorizeDto.itemApprovals.length} items`);
        for (const itemApproval of authorizeDto.itemApprovals) {
          await this.medicalOrderItemRepository.update(
            { item_id: itemApproval.itemId },
            {
              item_status: itemApproval.approved ? 'approved' : 'rejected',
              approved_quantity: itemApproval.approved ? itemApproval.approvedQuantity : 0,
              rejection_reason: itemApproval.rejectionReason
            }
          );
        }
      }

      console.log(`✅ Autorización completada`);
      
      // Registrar evento en el historial
      await this.recordHistoryEvent(id, {
        action: decision === 'approved' ? 'AUTHORIZED' : 
               decision === 'rejected' ? 'REJECTED' : 'PARTIALLY_AUTHORIZED',
        performedBy: userId,
        notes: authorizeDto.notes || `Pedido ${decision === 'approved' ? 'autorizado' : 
                                     decision === 'rejected' ? 'rechazado' : 'parcialmente autorizado'} manualmente`,
        details: {
          decision: decision,
          rejectionReason: authorizeDto.rejectionReason,
          authorizationType: 'manual',
          itemsProcessed: authorizeDto.itemApprovals?.length || 0
        }
      });
      
      return this.getMedicalOrderById(id);
    } catch (error) {
      console.error(`❌ Error en authorizeMedicalOrder:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al autorizar el pedido médico: ${error.message}`);
    }
  }

  async aiAuthorizeMedicalOrder(id: string): Promise<MedicalOrderResponseDto> {
    const startTime = new Date();
    
    try {
      const order = await this.medicalOrderRepository.findOne({
        where: { order_id: id }
      });

      if (!order) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      // Cargar los items del pedido por separado
      const items = await this.medicalOrderItemRepository.find({
        where: { order_id: id }
      });

      // Convertir a formato MedicalOrder para el análisis IA
      const orderForAI = {
        orderId: id,
        orderNumber: order.order_number,
        title: order.title,
        medicalJustification: order.medical_justification,
        diagnosis: order.diagnosis,
        treatmentPlan: order.treatment_plan,
        estimatedDurationDays: order.estimated_duration_days,
        urgencyId: order.urgency_id,
        items: items.map(item => ({
          itemId: item.item_id,
          itemName: item.item_name,
          itemType: item.item_type,
          requestedQuantity: item.requested_quantity,
          unitOfMeasure: item.unit_of_measure,
          medicalJustification: item.medical_justification,
          estimatedUnitCost: item.estimated_unit_cost
        })),
        getTotalEstimatedCost: () => order.estimated_cost || 0,
        isUrgent: () => order.urgency_id >= 4
      };

      // Realizar análisis de IA
      const aiAnalysis = await this.openAIService.analyzeMedicalOrder(orderForAI as any);

      // Convertir a formato extendido para persistencia
      const enhancedAnalysis: AIAnalysisResult = {
        decision: aiAnalysis.decision,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning,
        itemAnalysis: aiAnalysis.itemAnalysis?.map(item => {
          const orderItem = items.find(oi => oi.item_id === item.itemId);
          const itemName = orderItem?.item_name || 'Item';
          
          // Alinear la decisión del item con el análisis general cuando es apropiado
          let finalDecision = item.decision;
          
          // Si el análisis general es 'approved', los items deberían ser 'approved' también (a menos que tengan problemas específicos)
          if (aiAnalysis.decision === 'approved' && item.decision === 'requires_review') {
            finalDecision = 'approved';
          }
          
          // Si el análisis general es 'rejected', todos los items deberían ser 'rejected' también
          if (aiAnalysis.decision === 'rejected' && item.decision !== 'rejected') {
            finalDecision = 'rejected';
          }
          
          // Generar razonamiento específico basado en la decisión final
          let enhancedReasoning = item.reasoning;
          if (finalDecision === 'approved') {
            // Si fue aprobado por el análisis general, usar razonamiento positivo
            if (aiAnalysis.decision === 'approved' && item.decision === 'requires_review') {
              enhancedReasoning = `${itemName}: Aprobado. Medicamento apropiado para el diagnóstico y justificación médica según análisis de IA.`;
            } else {
              enhancedReasoning = `${itemName}: Aprobado. ${item.reasoning || 'Medicamento apropiado para el diagnóstico y justificación médica.'}`;
            }
          } else if (finalDecision === 'rejected') {
            // Si fue rechazado por el análisis general, usar ese razonamiento
            if (aiAnalysis.decision === 'rejected') {
              enhancedReasoning = `${itemName}: Rechazado. ${aiAnalysis.reasoning}`;
            } else {
              enhancedReasoning = `${itemName}: Rechazado. ${item.reasoning || 'No apropiado para la condición médica indicada.'}`;
            }
          } else if (finalDecision === 'requires_review') {
            enhancedReasoning = `${itemName}: Requiere revisión. ${item.reasoning || 'Necesita evaluación adicional por parte de un profesional médico.'}`;
          }
          
          return {
            itemId: item.itemId,
            decision: finalDecision,
            approvedQuantity: finalDecision === 'approved' ? item.approvedQuantity : 0,
            reasoning: enhancedReasoning,
            // Campos adicionales que pueden venir del análisis mejorado
            medicalAppropriatenessScore: finalDecision === 'approved' ? 0.95 : finalDecision === 'rejected' ? 0.2 : 0.6,
            dosageAppropriatenessScore: finalDecision === 'approved' ? 0.9 : 0.8,
            costEffectivenessScore: finalDecision === 'approved' ? 0.85 : 0.7,
            hasDrugInteraction: false,
            hasDosageConcern: finalDecision === 'partial',
            hasMedicalInconsistency: finalDecision === 'rejected',
            hasCostConcern: false
          };
        }) || [],
        riskFactors: (aiAnalysis.riskFactors || []).map(risk => ({
          type: risk.toUpperCase().replace(/\s+/g, '_'),
          level: this.determineRiskLevel(risk),
          description: risk,
          clinicalSignificance: this.determineClinicalSignificance(risk),
          requiresSpecialistReview: aiAnalysis.decision === 'requires_review'
        })),
        recommendations: (aiAnalysis.recommendations || []).map(rec => ({
          type: 'GENERAL_RECOMMENDATION',
          priority: aiAnalysis.decision === 'requires_review' ? 'high' : 'medium',
          title: 'Recomendación de IA',
          description: rec,
          suggestedAction: this.extractSuggestedAction(rec)
        })),
        metadata: {
          modelVersion: 'gpt-4',
          analysisType: 'automatic',
          processingTimeMs: new Date().getTime() - startTime.getTime(),
          medicalSpecialty: this.inferMedicalSpecialty(orderForAI),
          urgencyLevel: order.urgency_id
        }
      };

      // Persistir análisis completo en las nuevas tablas
      const savedAnalysis = await this.aiPersistenceService.saveAnalysis(
        id,
        orderForAI as any,
        enhancedAnalysis,
        startTime
      );

      // Obtener el análisis en formato legacy para compatibilidad
      const legacyAnalysis = await this.aiPersistenceService.getAnalysisInLegacyFormat(id);
      
      // Actualizar el pedido principal (mantener compatibilidad con formato legacy)
      order.ai_analysis_result = legacyAnalysis || aiAnalysis;
      order.ai_confidence_score = aiAnalysis.confidence;
      order.ai_analyzed_at = new Date();
      order.authorization_type = 'automatic';
      order.authorization_notes = aiAnalysis.reasoning;

      if (aiAnalysis.decision === 'approved') {
        order.state_id = 4; // Aprobado
        order.authorization_status = 'approved';
      } else if (aiAnalysis.decision === 'rejected') {
        order.state_id = 5; // Rechazado
        order.authorization_status = 'rejected';
      } else if (aiAnalysis.decision === 'requires_review') {
        order.state_id = 3; // En Revisión
        order.authorization_status = 'pending';
      } else {
        order.state_id = 6; // Parcialmente Aprobado
        order.authorization_status = 'partial';
      }

      await this.medicalOrderRepository.save(order);

      // Actualizar los items con el análisis de IA corregido
      if (enhancedAnalysis.itemAnalysis && enhancedAnalysis.itemAnalysis.length > 0) {
        console.log(`📦 Actualizando ${enhancedAnalysis.itemAnalysis.length} items con análisis de IA`);
        
        for (const item of items) {
          const aiItemAnalysis = enhancedAnalysis.itemAnalysis.find(ai => ai.itemId === item.item_id);
          if (aiItemAnalysis) {
            const newStatus = aiItemAnalysis.decision === 'approved' ? 'approved' : 
                             aiItemAnalysis.decision === 'rejected' ? 'rejected' : 
                             aiItemAnalysis.decision === 'requires_review' ? 'pending' : 'partial';
            
            const newApprovedQuantity = aiItemAnalysis.decision === 'approved' ? 
              (aiItemAnalysis.approvedQuantity || item.requested_quantity) : 0;
            
            console.log(`📦 Item ${item.item_name}: ${item.item_status} → ${newStatus} (${aiItemAnalysis.decision})`);
            
            await this.medicalOrderItemRepository.update(
              { item_id: item.item_id },
              {
                item_status: newStatus,
                approved_quantity: newApprovedQuantity,
                rejection_reason: aiItemAnalysis.decision === 'rejected' ? aiItemAnalysis.reasoning : null
              }
            );
          }
        }
      }

      // Registrar evento de análisis IA en el historial
      await this.recordHistoryEvent(id, {
        action: 'AI_ANALYZED',
        performedBy: 'system',
        notes: `Análisis de IA completado: ${aiAnalysis.decision === 'approved' ? 'Aprobado' : 
                 aiAnalysis.decision === 'rejected' ? 'Rechazado' : 
                 aiAnalysis.decision === 'requires_review' ? 'Requiere Revisión' : 'Parcial'}`,
        details: {
          aiDecision: aiAnalysis.decision,
          confidence: aiAnalysis.confidence,
          reasoning: aiAnalysis.reasoning,
          modelVersion: 'GPT-4',
          itemsAnalyzed: aiAnalysis.itemAnalysis?.length || 0,
          newState: order.state_id,
          analysisId: savedAnalysis.analysisId,
          processingTimeMs: enhancedAnalysis.metadata?.processingTimeMs
        }
      });

      return this.getMedicalOrderById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error en análisis IA: ${error.message}`);
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.medicalOrderRepository.count();
    return `MO-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  private async getOrdersStats(): Promise<any> {
    const totalOrders = await this.medicalOrderRepository.count();
    const pendingOrders = await this.medicalOrderRepository.count({
      where: { authorization_status: 'pending' }
    });
    const approvedOrders = await this.medicalOrderRepository.count({
      where: { authorization_status: 'approved' }
    });
    const rejectedOrders = await this.medicalOrderRepository.count({
      where: { authorization_status: 'rejected' }
    });

    const costResult = await this.medicalOrderRepository
      .createQueryBuilder('order')
      .select('SUM(order.estimated_cost)', 'totalEstimatedCost')
      .addSelect('SUM(order.approved_cost)', 'totalApprovedCost')
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalEstimatedCost: parseFloat(costResult.totalEstimatedCost || '0'),
      totalApprovedCost: parseFloat(costResult.totalApprovedCost || '0')
    };
  }

  private mapToResponseDto(order: MedicalOrderTypeOrmEntity | any, items?: MedicalOrderItemTypeOrmEntity[] | any[], useJoinData = false, enhancedAiAnalysis?: any): MedicalOrderResponseDto {
    const orderItems = items || [];
    
    // Determinar los nombres basados en si tenemos datos de JOIN o no
    let requesterName = 'Usuario';
    let affiliateName = 'Afiliado';
    let affiliateNumber = '';
    let healthcareProviderName = 'Obra Social';

    if (useJoinData && order.requester_name !== undefined) {
      // Datos de consulta con JOIN
      requesterName = order.requester_name || 'Usuario';
      affiliateName = order.affiliate_first_name && order.affiliate_last_name 
        ? `${order.affiliate_first_name} ${order.affiliate_last_name}`.trim()
        : 'Afiliado';
      affiliateNumber = order.affiliate_number || '';
      healthcareProviderName = order.healthcare_provider_name || 'Obra Social';
    }

    console.log(`🔄 Mapeando pedido ${order.order_number}:`, {
      useJoinData,
      requesterName,
      affiliateName,
      affiliateNumber,
      healthcareProviderName,
      hasEnhancedAi: !!enhancedAiAnalysis,
      itemsWithAi: orderItems.filter(item => item.ai_reasoning || item.ai_decision).length
    });
    
    return {
      orderId: order.order_id,
      orderNumber: order.order_number,
      requesterId: order.requester_id,
      requesterType: order.requester_type as RequesterType,
      requesterName: requesterName,
      affiliateId: order.affiliate_id,
      affiliateName: affiliateName,
      affiliateNumber: affiliateNumber,
      healthcareProviderName: healthcareProviderName,
      state: {
        id: order.state_id,
        name: this.getStateName(order.state_id),
        description: this.getStateName(order.state_id),
        isFinal: order.state_id >= 4
      },
      urgency: {
        id: order.urgency_id,
        name: this.getUrgencyName(order.urgency_id),
        description: this.getUrgencyName(order.urgency_id),
        priorityLevel: order.urgency_id,
        colorCode: this.getUrgencyColor(order.urgency_id)
      },
      title: order.title,
      description: order.description,
      medicalJustification: order.medical_justification,
      diagnosis: order.diagnosis,
      treatmentPlan: order.treatment_plan,
      estimatedDurationDays: order.estimated_duration_days,
      items: orderItems.map(item => {
        // Determinar análisis de IA para este artículo específico
        let aiAnalysis = null;
        
        if (item.ai_reasoning || item.ai_decision) {
          // Datos de análisis de IA desde las nuevas tablas
          aiAnalysis = {
            decision: item.ai_decision || 'pending',
            reasoning: item.ai_reasoning || item.rejection_reasoning || 'Análisis de IA disponible',
            confidence: item.medical_appropriateness_score || 0.8,
            approvedQuantity: item.ai_approved_quantity || item.approved_quantity,
            medicalAppropriatenessScore: item.medical_appropriateness_score,
            dosageAppropriatenessScore: item.dosage_appropriateness_score,
            costEffectivenessScore: item.cost_effectiveness_score,
            hasDrugInteraction: item.has_drug_interaction || false,
            hasDosageConcern: item.has_dosage_concern || false,
            hasMedicalInconsistency: item.has_medical_inconsistency || false,
            hasCostConcern: item.has_cost_concern || false,
            suggestions: this.generateItemSuggestions(item, order)
          };
        } else if (enhancedAiAnalysis?.itemAnalysis) {
          // Buscar en el análisis general si no hay datos específicos en las nuevas tablas
          const itemAiData = enhancedAiAnalysis.itemAnalysis.find(ai => ai.itemId === item.item_id);
          if (itemAiData) {
            aiAnalysis = {
              decision: itemAiData.decision,
              reasoning: itemAiData.reasoning,
              confidence: itemAiData.confidence || 0.8,
              approvedQuantity: itemAiData.approvedQuantity,
              suggestions: this.generateItemSuggestions(item, order, itemAiData)
            };
          }
        } else if (item.rejection_reason && item.item_status === 'rejected') {
          // Fallback a datos básicos si están disponibles
          aiAnalysis = {
            decision: 'rejected',
            reasoning: item.rejection_reason,
            confidence: 0.8,
            suggestions: this.generateItemSuggestions(item, order)
          };
        }

        return {
          itemId: item.item_id,
          categoryId: item.category_id,
          categoryName: 'Categoría', // TODO: Obtener nombre real de la categoría
          itemType: item.item_type,
          itemName: item.item_name,
          itemCode: item.item_code,
          itemDescription: item.item_description,
          requestedQuantity: item.requested_quantity,
          approvedQuantity: item.approved_quantity,
          unitOfMeasure: item.unit_of_measure,
          brand: item.brand,
          presentation: item.presentation,
          concentration: item.concentration,
          administrationRoute: item.administration_route,
          medicalJustification: item.medical_justification,
          estimatedUnitCost: item.estimated_unit_cost ? parseFloat(item.estimated_unit_cost.toString()) : null,
          itemStatus: item.item_status,
          rejectionReason: item.rejection_reason,
          // Análisis de IA detallado por artículo
          aiAnalysis: aiAnalysis
        };
      }),
      hasAttachments: order.has_attachments || false,
      attachmentCount: 0,
      estimatedCost: parseFloat(order.estimated_cost?.toString() || '0'),
      approvedCost: order.approved_cost ? parseFloat(order.approved_cost.toString()) : null,
      rejectionReason: order.rejection_reason,
      authorizationStatus: order.authorization_status,
      authorizationType: order.authorization_type,
      authorizedBy: order.authorized_by,
      authorizedAt: order.authorized_at,
      authorizationNotes: order.authorization_notes,
      aiAnalysisResult: enhancedAiAnalysis || order.ai_analysis_result,
      aiConfidenceScore: order.ai_confidence_score ? parseFloat(order.ai_confidence_score.toString()) : null,
      aiAnalyzedAt: order.ai_analyzed_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      stats: {
        totalItems: orderItems.length,
        approvedItems: orderItems.filter(item => item.item_status === 'approved').length,
        rejectedItems: orderItems.filter(item => item.item_status === 'rejected').length,
        pendingItems: orderItems.filter(item => item.item_status === 'pending').length
      }
    };
  }

  // Método auxiliar para generar sugerencias específicas por artículo
  private generateItemSuggestions(item: any, order: any, aiData?: any): string[] {
    const suggestions: string[] = [];
    const itemName = item.item_name?.toLowerCase() || '';
    const justification = (item.medical_justification || order.medical_justification || '').toLowerCase();
    const diagnosis = (order.diagnosis || '').toLowerCase();

    // Sugerencias basadas en inconsistencias médicas detectadas
    if (item.has_medical_inconsistency || aiData?.hasMedicalInconsistency) {
      if (this.isCardiovascularMedication(itemName)) {
        if (justification.includes('tos') || justification.includes('fractura') || justification.includes('dolor')) {
          suggestions.push(`${item.item_name} es un medicamento cardiovascular. Para ${justification} se recomiendan: expectorantes (tos), analgésicos (dolor) o antiinflamatorios (fracturas).`);
        }
      }
      
      if (this.isAntibiotic(itemName)) {
        if (!justification.includes('infección') && !justification.includes('bacteria')) {
          suggestions.push(`${item.item_name} es un antibiótico. Solo debe usarse para infecciones bacterianas confirmadas.`);
        }
      }
    }

    // Sugerencias basadas en cantidad
    if (item.has_dosage_concern || (item.requested_quantity > 30 && this.isMedication(item))) {
      suggestions.push(`Cantidad solicitada (${item.requested_quantity}) es elevada. Considere reducir a 15-30 unidades según protocolo.`);
    }

    // Sugerencias basadas en costo
    if (item.has_cost_concern || (item.estimated_unit_cost && item.estimated_unit_cost > 5000)) {
      suggestions.push(`Costo unitario elevado ($${item.estimated_unit_cost}). Evalúe alternativas genéricas o de menor costo.`);
    }

    // Sugerencias basadas en interacciones
    if (item.has_drug_interaction) {
      suggestions.push(`Posible interacción medicamentosa. Verifique compatibilidad con otros medicamentos del paciente.`);
    }

    // Sugerencia por defecto si no hay específicas
    if (suggestions.length === 0 && aiData?.decision === 'requires_review') {
      suggestions.push(`Artículo requiere revisión médica adicional para confirmar su adecuación al diagnóstico.`);
    }

    return suggestions;
  }

  private getStateName(stateId: number): string {
    const states = {
      1: 'Borrador',
      2: 'Pendiente',
      3: 'En Revisión',
      4: 'Aprobado',
      5: 'Rechazado',
      6: 'Parcialmente Aprobado',
      7: 'En Proceso',
      8: 'Completado',
      9: 'Cancelado'
    };
    return states[stateId] || 'Desconocido';
  }

  private getUrgencyName(urgencyId: number): string {
    const urgencies = {
      1: 'Baja',
      2: 'Normal',
      3: 'Alta',
      4: 'Urgente',
      5: 'Crítica'
    };
    return urgencies[urgencyId] || 'Normal';
  }

  private getUrgencyColor(urgencyId: number): string {
    const colors = {
      1: '#10B981',
      2: '#3B82F6',
      3: '#F59E0B',
      4: '#EF4444',
      5: '#DC2626'
    };
    return colors[urgencyId] || '#3B82F6';
  }

  async getAuthorizationHistory(orderId: string): Promise<any[]> {
    try {
      const order = await this.medicalOrderRepository.findOne({
        where: { order_id: orderId }
      });

      if (!order) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      // Función auxiliar para obtener el nombre del usuario
      const getUserName = async (userId: string): Promise<string> => {
        if (!userId || userId === 'system') {
          return 'Sistema IA';
        }
        
        try {
          const userQuery = `
            SELECT COALESCE(nombre, username, 'Usuario') as user_name 
            FROM usuarios 
            WHERE usuario_id = $1
          `;
          const userResult = await this.medicalOrderRepository.query(userQuery, [userId]);
          return userResult[0]?.user_name || 'Usuario';
        } catch (error) {
          console.warn(`No se pudo obtener el nombre del usuario ${userId}:`, error.message);
          return 'Usuario';
        }
      };

      const history = [];

      // 1. Evento de creación
      const creatorName = await getUserName(order.created_by);
      history.push({
        id: `${orderId}-created`,
        action: 'CREATED',
        performedBy: order.created_by,
        performedByName: creatorName,
        performedAt: order.created_at,
        notes: `Pedido médico creado: ${order.title}`,
        details: {
          orderNumber: order.order_number,
          initialState: 'DRAFT',
          urgencyLevel: this.getUrgencyName(order.urgency_id)
        }
      });

      // 2. Evento de análisis de IA (si existe)
      if (order.ai_analyzed_at && order.ai_analysis_result) {
        const aiDecision = order.ai_analysis_result.decision || 'unknown';
        history.push({
          id: `${orderId}-ai-analyzed`,
          action: 'AI_ANALYZED',
          performedBy: 'system',
          performedByName: 'Sistema IA',
          performedAt: order.ai_analyzed_at,
          notes: `Análisis de IA completado: ${aiDecision === 'approved' ? 'Aprobado' : 
                   aiDecision === 'rejected' ? 'Rechazado' : 
                   aiDecision === 'requires_review' ? 'Requiere Revisión' : 'Parcial'}`,
          details: {
            aiDecision: aiDecision,
            confidence: order.ai_confidence_score,
            reasoning: order.ai_analysis_result.reasoning || order.authorization_notes,
            modelVersion: 'GPT-4',
            itemsAnalyzed: order.ai_analysis_result.itemAnalysis?.length || 0
          }
        });
      }

      // 3. Evento de autorización manual (si existe)
      if (order.authorized_at && order.authorization_type === 'manual') {
        const authorizerName = await getUserName(order.authorized_by);
        history.push({
          id: `${orderId}-authorized`,
          action: order.authorization_status === 'approved' ? 'AUTHORIZED' : 
                 order.authorization_status === 'rejected' ? 'REJECTED' : 'PARTIALLY_AUTHORIZED',
          performedBy: order.authorized_by,
          performedByName: authorizerName,
          performedAt: order.authorized_at,
          notes: order.authorization_notes || 
                `Pedido ${order.authorization_status === 'approved' ? 'autorizado' : 
                         order.authorization_status === 'rejected' ? 'rechazado' : 'parcialmente autorizado'} manualmente`,
          details: {
            decision: order.authorization_status,
            rejectionReason: order.rejection_reason,
            authorizationType: 'manual'
          }
        });
      }

      // 4. Eventos de modificación (si existe updated_at diferente a created_at)
      if (order.updated_at && order.updated_at.getTime() !== order.created_at.getTime()) {
        const updaterName = await getUserName(order.updated_by || order.created_by);
        history.push({
          id: `${orderId}-modified`,
          action: 'MODIFIED',
          performedBy: order.updated_by || order.created_by,
          performedByName: updaterName,
          performedAt: order.updated_at,
          notes: 'Pedido médico modificado',
          details: {
            modificationType: 'UPDATE',
            previousState: this.getStateName(order.state_id)
          }
        });
      }

      // Ordenar por fecha (más reciente primero)
      history.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

      return history;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener historial de autorizaciones: ${error.message}`);
    }
  }

  async correctMedicalOrder(id: string, correctDto: CorrectMedicalOrderDto, userId: string): Promise<MedicalOrderResponseDto> {
    try {
      console.log(`🔧 Corrigiendo pedido médico ${id}`);
      
      const order = await this.medicalOrderRepository.findOne({
        where: { order_id: id }
      });

      if (!order) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      // Verificar que el pedido puede ser corregido
      if (!['pending', 'rejected', 'partial'].includes(order.authorization_status)) {
        throw new BadRequestException('El pedido no puede ser corregido en su estado actual');
      }

      // Verificar que el usuario tiene permisos para corregir (debe ser el creador)
      if (order.created_by !== userId) {
        throw new BadRequestException('Solo el creador del pedido puede realizar correcciones');
      }

      // Actualizar información general del pedido si se proporciona
      if (correctDto.medicalJustification) {
        order.medical_justification = correctDto.medicalJustification;
      }
      if (correctDto.diagnosis) {
        order.diagnosis = correctDto.diagnosis;
      }
      if (correctDto.treatmentPlan) {
        order.treatment_plan = correctDto.treatmentPlan;
      }

      // Resetear el estado del pedido a pendiente para nueva evaluación
      order.state_id = 2; // Pendiente
      order.authorization_status = 'pending';
      order.updated_by = userId;
      order.updated_at = new Date();

      // Limpiar análisis previo de IA si se van a hacer correcciones significativas
      if (correctDto.itemCorrections && correctDto.itemCorrections.length > 0) {
        order.ai_analysis_result = null;
        order.ai_confidence_score = null;
        order.ai_analyzed_at = null;
        order.authorized_by = null;
        order.authorized_at = null;
        order.authorization_notes = null;
        order.rejection_reason = null;
      }

      await this.medicalOrderRepository.save(order);

      // Procesar correcciones de items
      if (correctDto.itemCorrections && correctDto.itemCorrections.length > 0) {
        console.log(`📦 Procesando correcciones de ${correctDto.itemCorrections.length} items`);
        
        for (const correction of correctDto.itemCorrections) {
          await this.processItemCorrection(id, correction, userId);
        }
      }

      // Registrar evento en el historial
      await this.recordHistoryEvent(id, {
        action: 'CORRECTED',
        performedBy: userId,
        notes: `Pedido corregido: ${correctDto.correctionNotes}`,
        details: {
          itemCorrections: correctDto.itemCorrections?.length || 0,
          generalChanges: {
            medicalJustification: !!correctDto.medicalJustification,
            diagnosis: !!correctDto.diagnosis,
            treatmentPlan: !!correctDto.treatmentPlan
          },
          requestNewAiAnalysis: correctDto.requestNewAiAnalysis
        }
      });

      // Si se solicita nuevo análisis de IA, ejecutarlo automáticamente
      if (correctDto.requestNewAiAnalysis) {
        console.log(`🤖 Ejecutando nuevo análisis de IA automáticamente...`);
        try {
          await this.aiAuthorizeMedicalOrder(id);
        } catch (aiError) {
          console.error('Error en análisis automático de IA:', aiError);
          // No lanzamos el error para no interrumpir el proceso de corrección
        }
      }

      console.log(`✅ Corrección completada, retornando datos actualizados`);
      return this.getMedicalOrderById(id);
    } catch (error) {
      console.error(`❌ Error en correctMedicalOrder:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al corregir el pedido médico: ${error.message}`);
    }
  }

  private async processItemCorrection(orderId: string, correction: ItemCorrectionDto, userId: string): Promise<void> {
    try {
      const item = await this.medicalOrderItemRepository.findOne({
        where: { item_id: correction.itemId, order_id: orderId }
      });

      if (!item) {
        throw new NotFoundException(`Item ${correction.itemId} no encontrado en el pedido`);
      }

      switch (correction.action) {
        case 'modify':
          // Modificar item existente
          if (correction.newQuantity) {
            item.requested_quantity = correction.newQuantity;
          }
          if (correction.newMedicalJustification) {
            item.medical_justification = correction.newMedicalJustification;
          }
          // Resetear estado del item
          item.item_status = 'pending';
          item.rejection_reason = null;
          item.approved_quantity = null;
          
          await this.medicalOrderItemRepository.save(item);
          break;

        case 'replace':
          // Reemplazar item con uno nuevo
          if (!correction.replacementItem) {
            throw new BadRequestException('Se requiere replacementItem para la acción replace');
          }
          
          // Eliminar item anterior
          await this.medicalOrderItemRepository.remove(item);
          
          // Crear nuevo item
          const newItem = this.medicalOrderItemRepository.create({
            order_id: orderId,
            category_id: correction.replacementItem.categoryId,
            item_type: correction.replacementItem.itemType,
            item_name: correction.replacementItem.itemName,
            item_code: correction.replacementItem.itemCode,
            item_description: correction.replacementItem.itemDescription,
            requested_quantity: correction.replacementItem.requestedQuantity,
            unit_of_measure: correction.replacementItem.unitOfMeasure,
            brand: correction.replacementItem.brand,
            presentation: correction.replacementItem.presentation,
            concentration: correction.replacementItem.concentration,
            administration_route: correction.replacementItem.administrationRoute,
            medical_justification: correction.replacementItem.medicalJustification,
            estimated_unit_cost: correction.replacementItem.estimatedUnitCost,
            item_status: 'pending'
          });
          
          await this.medicalOrderItemRepository.save(newItem);
          break;

        case 'remove':
          // Eliminar item
          await this.medicalOrderItemRepository.remove(item);
          break;

        default:
          throw new BadRequestException(`Acción no válida: ${correction.action}`);
      }
    } catch (error) {
      console.error(`Error procesando corrección de item ${correction.itemId}:`, error);
      throw error;
    }
  }

  // Método auxiliar para registrar eventos en el historial
  private async recordHistoryEvent(orderId: string, event: {
    action: string;
    performedBy: string;
    notes: string;
    details?: any;
  }): Promise<void> {
    try {
      // Por ahora solo loggeamos el evento, pero en el futuro podríamos
      // guardarlo en una tabla separada de historial si es necesario
      console.log(`📝 ${event.action}: ${event.notes}`);
    } catch (error) {
      console.error('Error registrando evento en historial:', error);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  async getMedicalCategories(): Promise<any[]> {
    try {
      // Mock de categorías médicas
      return [
        { id: 1, name: 'Medicamentos', description: 'Medicamentos y fármacos' },
        { id: 2, name: 'Equipos Médicos', description: 'Equipos y dispositivos médicos' },
        { id: 3, name: 'Suministros', description: 'Suministros médicos generales' },
        { id: 4, name: 'Instrumental', description: 'Instrumental quirúrgico' },
        { id: 5, name: 'Prótesis', description: 'Prótesis y órtesis' },
        { id: 6, name: 'Reactivos', description: 'Reactivos de laboratorio' }
      ];
    } catch (error) {
      throw new BadRequestException(`Error al obtener categorías médicas: ${error.message}`);
    }
  }

  async getUrgencyTypes(): Promise<any[]> {
    try {
      // Mock de tipos de urgencia
      return [
        { id: 1, name: 'Baja', description: 'Prioridad baja', colorCode: '#10B981' },
        { id: 2, name: 'Normal', description: 'Prioridad normal', colorCode: '#3B82F6' },
        { id: 3, name: 'Alta', description: 'Prioridad alta', colorCode: '#F59E0B' },
        { id: 4, name: 'Urgente', description: 'Urgente', colorCode: '#EF4444' },
        { id: 5, name: 'Crítica', description: 'Prioridad crítica', colorCode: '#DC2626' }
      ];
    } catch (error) {
      throw new BadRequestException(`Error al obtener tipos de urgencia: ${error.message}`);
    }
  }

  async getDashboardStats(userId?: string): Promise<any> {
    try {
      // Obtener estadísticas generales
      const baseStats = await this.getOrdersStats();
      
      // Estadísticas adicionales para el dashboard
      const aiAnalyzedOrders = await this.medicalOrderRepository.count({
        where: { authorization_type: 'automatic' }
      });
      
      const manualAnalyzedOrders = await this.medicalOrderRepository.count({
        where: { authorization_type: 'manual' }
      });

      const avgProcessingTime = 2.5; // Mock - en días
      const successRate = 85; // Mock - porcentaje

      return {
        ...baseStats,
        aiAnalyzedOrders,
        manualAnalyzedOrders,
        avgProcessingTime,
        successRate,
        recentActivity: {
          todayOrders: 5,
          weekOrders: 23,
          monthOrders: 87
        }
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener estadísticas del dashboard: ${error.message}`);
    }
  }

  async searchAffiliates(params: {
    search: string;
    page: number;
    limit: number;
  }) {
    try {
      // Obtener todos los afiliados de la base de datos
      const allAffiliates = await this.afiliadoRepository.findAll();
      
      // Filtrar por término de búsqueda si se proporciona
      let filteredAffiliates = allAffiliates;
      if (params.search.trim()) {
        const searchTerm = params.search.toLowerCase().trim();
        filteredAffiliates = allAffiliates.filter(affiliate => 
          affiliate.firstName.toLowerCase().includes(searchTerm) ||
          affiliate.lastName.toLowerCase().includes(searchTerm) ||
          affiliate.affiliateNumber.toLowerCase().includes(searchTerm) ||
          affiliate.cuil.toLowerCase().includes(searchTerm) ||
          affiliate.email.toLowerCase().includes(searchTerm) ||
          `${affiliate.firstName} ${affiliate.lastName}`.toLowerCase().includes(searchTerm)
        );
      }

      // Calcular paginación
      const total = filteredAffiliates.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedAffiliates = filteredAffiliates.slice(startIndex, endIndex);

      // Transformar datos al formato esperado por el frontend
      const transformedAffiliates = await Promise.all(paginatedAffiliates.map(async (affiliate) => {
        // Obtener obras sociales asociadas al afiliado con sus nombres reales
        const healthcareProviders = await this.getHealthcareProvidersWithNames(affiliate.id);

        return {
          affiliateId: affiliate.id,
          firstName: affiliate.firstName,
          lastName: affiliate.lastName,
          affiliateNumber: affiliate.affiliateNumber,
          cuil: affiliate.cuil,
          email: affiliate.email,
          healthcareProviders
        };
      }));

      return {
        data: transformedAffiliates,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1
        }
      };
    } catch (error) {
      throw new BadRequestException(`Error al buscar afiliados: ${error.message}`);
    }
  }

  // Método auxiliar para obtener obras sociales con nombres reales desde la base de datos
  private async getHealthcareProvidersWithNames(affiliateId: string): Promise<{ healthcareProviderId: string; name: string }[]> {
    try {
      // Obtener los IDs de las obras sociales asociadas
      const healthcareProviderIds = await this.afiliadoRepository.getHealthcareProvidersAssociated(affiliateId);
      
      if (healthcareProviderIds.length === 0) {
        return [];
      }

      // Obtener los nombres reales desde la base de datos usando el pool de conexiones
      // Necesitamos acceder al pool desde el repositorio de afiliados
      const healthcareProviders = [];
      
      for (const providerId of healthcareProviderIds) {
        const name = await this.getHealthcareProviderNameFromDB(providerId);
        healthcareProviders.push({
          healthcareProviderId: providerId,
          name: name
        });
      }

      return healthcareProviders;
    } catch (error) {
      console.error('Error obteniendo nombres de obras sociales:', error);
      // Fallback: retornar array vacío si hay error
      return [];
    }
  }

  // Método auxiliar para obtener el nombre de una obra social desde la base de datos
  private async getHealthcareProviderNameFromDB(providerId: string): Promise<string> {
    try {
      // Usamos el pool de conexiones del repositorio de afiliados para hacer la consulta
      // Esto es temporal hasta que tengamos un repositorio específico para obras sociales
      const result = await (this.afiliadoRepository as any).pool.query(
        'SELECT name FROM obras_sociales WHERE healthcare_provider_id = $1',
        [providerId]
      );
      
      return result.rows.length > 0 ? result.rows[0].name : 'Obra Social';
    } catch (error) {
      console.error('Error consultando obra social:', error);
      return 'Obra Social';
    }
  }

  // Método auxiliar para obtener nombres de obras sociales (mock por ahora)
  private getHealthcareProviderName(providerId: string): string {
    const names = {
      'hp1': 'OSDE',
      'hp2': 'Swiss Medical',
      'hp3': 'Galeno',
      'hp4': 'Medicus',
      'hp5': 'Unión Personal',
      'hp6': 'IOMA'
    };
    return names[providerId] || 'Obra Social';
  }

  // Métodos auxiliares para análisis de IA
  private determineRiskLevel(risk: string): 'low' | 'medium' | 'high' | 'critical' {
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('crítico') || riskLower.includes('critical') || riskLower.includes('contraindi')) {
      return 'critical';
    }
    if (riskLower.includes('alto') || riskLower.includes('high') || riskLower.includes('excesiv')) {
      return 'high';
    }
    if (riskLower.includes('medio') || riskLower.includes('medium') || riskLower.includes('moderad')) {
      return 'medium';
    }
    return 'low';
  }

  private determineClinicalSignificance(risk: string): 'minor' | 'moderate' | 'major' | 'contraindicated' {
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('contraindi') || riskLower.includes('prohibid')) {
      return 'contraindicated';
    }
    if (riskLower.includes('mayor') || riskLower.includes('major') || riskLower.includes('grave')) {
      return 'major';
    }
    if (riskLower.includes('moderad') || riskLower.includes('moderate')) {
      return 'moderate';
    }
    return 'minor';
  }

  private extractSuggestedAction(recommendation: string): string {
    const recLower = recommendation.toLowerCase();
    if (recLower.includes('reducir') || recLower.includes('disminuir')) {
      return 'reduce_quantity';
    }
    if (recLower.includes('reemplazar') || recLower.includes('cambiar') || recLower.includes('alternativ')) {
      return 'replace_medication';
    }
    if (recLower.includes('revisar') || recLower.includes('evaluar')) {
      return 'manual_review';
    }
    if (recLower.includes('monitorear') || recLower.includes('seguimiento')) {
      return 'add_monitoring';
    }
    return 'general_review';
  }

  private inferMedicalSpecialty(order: any): string {
    const diagnosis = (order.diagnosis || '').toLowerCase();
    const justification = (order.medicalJustification || '').toLowerCase();
    const items = order.items || [];
    
    // Análisis básico por palabras clave
    if (diagnosis.includes('fractura') || diagnosis.includes('trauma') || diagnosis.includes('ortop')) {
      return 'Traumatología';
    }
    if (diagnosis.includes('cardiaco') || diagnosis.includes('cardio') || diagnosis.includes('corazón')) {
      return 'Cardiología';
    }
    if (diagnosis.includes('diabetes') || diagnosis.includes('endocrin')) {
      return 'Endocrinología';
    }
    if (diagnosis.includes('infección') || diagnosis.includes('bacteria') || diagnosis.includes('antibiótico')) {
      return 'Infectología';
    }
    
    // Análisis por items
    const medicationTypes = items.map(item => (item.itemName || '').toLowerCase());
    if (medicationTypes.some(med => med.includes('insulina') || med.includes('metformina'))) {
      return 'Endocrinología';
    }
    if (medicationTypes.some(med => med.includes('losartán') || med.includes('enalapril'))) {
      return 'Cardiología';
    }
    
    return 'Medicina General';
  }

  private mapRawToResponseDto(order: any): MedicalOrderResponseDto {
    return {
      orderId: order.order_id,
      orderNumber: order.order_number,
      requesterId: order.requester_id,
      requesterType: order.requester_type,
      requesterName: order.requester_name || 'Usuario',
      affiliateId: order.affiliate_id,
      affiliateName: `${order.affiliate_first_name || ''} ${order.affiliate_last_name || ''}`.trim() || 'Afiliado',
      affiliateNumber: order.affiliate_number || '',
      healthcareProviderName: order.healthcare_provider_name || 'Obra Social',
      state: {
        id: order.state_id,
        name: order.state_name || this.getStateName(order.state_id),
        description: order.state_name || this.getStateName(order.state_id),
        isFinal: order.state_id >= 4 // Estados 4+ son finales (aprobado, rechazado, etc.)
      },
      urgency: {
        id: order.urgency_id,
        name: order.urgency_name || this.getUrgencyName(order.urgency_id),
        description: order.urgency_name || this.getUrgencyName(order.urgency_id),
        priorityLevel: order.urgency_id,
        colorCode: order.urgency_color || this.getUrgencyColor(order.urgency_id)
      },
      title: order.title,
      description: order.description,
      medicalJustification: order.medical_justification,
      diagnosis: order.diagnosis,
      treatmentPlan: order.treatment_plan,
      estimatedDurationDays: order.estimated_duration_days,
      items: [], // Los items se cargan por separado si es necesario
      hasAttachments: order.has_attachments || false,
      attachmentCount: 0, // Se puede calcular si es necesario
      estimatedCost: parseFloat(order.estimated_cost) || 0,
      approvedCost: order.approved_cost ? parseFloat(order.approved_cost.toString()) : null,
      rejectionReason: order.rejection_reason,
      authorizationStatus: order.authorization_status,
      authorizationType: order.authorization_type,
      authorizedBy: order.authorized_by,
      authorizedAt: order.authorized_at,
      authorizationNotes: order.authorization_notes,
      aiAnalysisResult: order.ai_analysis_result,
      aiConfidenceScore: order.ai_confidence_score ? parseFloat(order.ai_confidence_score.toString()) : null,
      aiAnalyzedAt: order.ai_analyzed_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      stats: {
        totalItems: 0,
        approvedItems: 0,
        rejectedItems: 0,
        pendingItems: 0
      }
    };
  }

  /**
   * Refresca y corrige el análisis de IA de un pedido médico
   */
  async refreshAIAnalysis(id: string): Promise<MedicalOrderResponseDto> {
    try {
      // Obtener análisis existente
      const existingAnalysis = await this.aiPersistenceService.getLatestAnalysis(id);
      if (!existingAnalysis) {
        throw new BadRequestException('No existe análisis de IA previo para este pedido');
      }

      // Obtener el pedido y sus items
      const order = await this.medicalOrderRepository.findOne({
        where: { order_id: id }
      });

      if (!order) {
        throw new NotFoundException('Pedido médico no encontrado');
      }

      const items = await this.medicalOrderItemRepository.find({
        where: { order_id: id }
      });

      // Crear análisis corregido basado en el análisis general
      const correctedItemAnalysis = existingAnalysis.itemAnalyses?.map(itemAnalysis => {
        const orderItem = items.find(oi => oi.item_id === itemAnalysis.medicalOrderItemId);
        const itemName = orderItem?.item_name || 'Item';
        
        // Corregir decisión del item basada en la decisión general
        let correctedDecision = itemAnalysis.itemDecision;
        let correctedReasoning = itemAnalysis.aiReasoning || '';
        let correctedRejectionReasoning = itemAnalysis.rejectionReasoning;

        if (existingAnalysis.overallDecision === 'rejected' && itemAnalysis.itemDecision !== 'rejected') {
          correctedDecision = 'rejected';
          correctedReasoning = `${itemName}: Rechazado. ${existingAnalysis.reasoning}`;
          correctedRejectionReasoning = existingAnalysis.reasoning;
        }

        return {
          ...itemAnalysis,
          itemDecision: correctedDecision,
          aiReasoning: correctedReasoning,
          rejectionReasoning: correctedRejectionReasoning,
          hasMedicalInconsistency: correctedDecision === 'rejected'
        };
      }) || [];

      // Actualizar registros en la base de datos
      for (const correctedItem of correctedItemAnalysis) {
        await this.aiPersistenceService.updateItemAnalysis(
          correctedItem.itemAnalysisId,
          {
            itemDecision: correctedItem.itemDecision,
            aiReasoning: correctedItem.aiReasoning,
            rejectionReasoning: correctedItem.rejectionReasoning,
            hasMedicalInconsistency: correctedItem.hasMedicalInconsistency
          }
        );
      }

      // Actualizar el análisis legacy en el pedido
      const legacyAnalysis = await this.aiPersistenceService.getAnalysisInLegacyFormat(id);
      order.ai_analysis_result = legacyAnalysis;
      await this.medicalOrderRepository.save(order);

      // Registrar evento de corrección
      await this.recordHistoryEvent(id, {
        action: 'AI_ANALYSIS_REFRESHED',
        performedBy: 'system',
        notes: 'Análisis de IA refrescado y corregido para sincronizar decisiones de items con análisis general',
        details: {
          analysisId: existingAnalysis.analysisId,
          correctedItems: correctedItemAnalysis.length
        }
      });

      return this.getMedicalOrderById(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al refrescar análisis IA: ${error.message}`);
    }
  }

  // Método alternativo usando consulta SQL directa con JOINs
  async getMedicalOrdersWithJoins(query: MedicalOrderQueryDto): Promise<MedicalOrderListResponseDto> {
    try {
      console.log('🔍 Usando consulta SQL directa con JOINs');
      
      const page = query.page || 1;
      const limit = query.limit || 10;
      const offset = (page - 1) * limit;

      // Consulta SQL con JOINs para obtener toda la información de una vez
      const sqlQuery = `
        SELECT 
          mo.order_id,
          mo.order_number,
          mo.requester_id,
          mo.requester_type,
          mo.affiliate_id,
          mo.healthcare_provider_id,
          mo.state_id,
          mo.urgency_id,
          mo.title,
          mo.description,
          mo.medical_justification,
          mo.diagnosis,
          mo.treatment_plan,
          mo.estimated_duration_days,
          mo.has_attachments,
          mo.estimated_cost,
          mo.approved_cost,
          mo.rejection_reason,
          mo.authorization_status,
          mo.authorization_type,
          mo.authorized_by,
          mo.authorized_at,
          mo.authorization_notes,
          mo.ai_analysis_result,
          mo.ai_confidence_score,
          mo.ai_analyzed_at,
          mo.created_at,
          mo.updated_at,
          -- Información del usuario solicitante
          u.nombre as requester_name,
          -- Información del afiliado
          a.first_name as affiliate_first_name,
          a.last_name as affiliate_last_name,
          a.affiliate_number,
          -- Información de la obra social
          os.name as healthcare_provider_name
        FROM medical_orders mo
        LEFT JOIN usuarios u ON mo.requester_id = u.user_id
        LEFT JOIN afiliados a ON mo.affiliate_id = a.affiliate_id
        LEFT JOIN obras_sociales os ON mo.healthcare_provider_id = os.healthcare_provider_id
        ORDER BY mo.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM medical_orders mo
      `;

      console.log('📊 Ejecutando consultas...');
      const [ordersResult, countResult] = await Promise.all([
        this.medicalOrderRepository.query(sqlQuery, [limit, offset]),
        this.medicalOrderRepository.query(countQuery)
      ]);

      const orders = ordersResult;
      const total = parseInt(countResult[0].total);

      console.log(`📊 Encontrados ${orders.length} pedidos de un total de ${total}`);

      if (orders.length === 0) {
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          stats: {
            totalOrders: 0,
            pendingOrders: 0,
            approvedOrders: 0,
            rejectedOrders: 0,
            totalEstimatedCost: 0,
            totalApprovedCost: 0
          }
        };
      }

      // Transformar datos usando la información obtenida del JOIN
      const transformedOrders: MedicalOrderResponseDto[] = orders.map((order) => {
        const requesterName = order.requester_name || 'Usuario';
        const affiliateName = order.affiliate_first_name && order.affiliate_last_name 
          ? `${order.affiliate_first_name} ${order.affiliate_last_name}`.trim()
          : 'Afiliado';
        const affiliateNumber = order.affiliate_number || 'N/A';
        const healthcareProviderName = order.healthcare_provider_name || 'Obra Social';

        console.log(`✅ Procesando pedido ${order.order_number}:`, {
          requesterName,
          affiliateName,
          healthcareProviderName
        });

        return {
          orderId: order.order_id,
          orderNumber: order.order_number || `MO-${order.order_id.slice(-8)}`,
          requesterId: order.requester_id,
          requesterType: order.requester_type,
          requesterName: requesterName,
          affiliateId: order.affiliate_id,
          affiliateName: affiliateName,
          affiliateNumber: affiliateNumber,
          healthcareProviderName: healthcareProviderName,
          state: {
            id: order.state_id,
            name: this.getStateName(order.state_id),
            description: this.getStateName(order.state_id),
            isFinal: order.state_id >= 4
          },
          urgency: {
            id: order.urgency_id,
            name: this.getUrgencyName(order.urgency_id),
            description: this.getUrgencyName(order.urgency_id),
            priorityLevel: order.urgency_id,
            colorCode: this.getUrgencyColor(order.urgency_id)
          },
          title: order.title,
          description: order.description,
          medicalJustification: order.medical_justification,
          diagnosis: order.diagnosis,
          treatmentPlan: order.treatment_plan,
          estimatedDurationDays: order.estimated_duration_days,
          items: [],
          hasAttachments: order.has_attachments || false,
          attachmentCount: 0,
          estimatedCost: parseFloat(order.estimated_cost?.toString() || '0'),
          approvedCost: order.approved_cost ? parseFloat(order.approved_cost.toString()) : null,
          rejectionReason: order.rejection_reason,
          authorizationStatus: order.authorization_status,
          authorizationType: order.authorization_type,
          authorizedBy: order.authorized_by,
          authorizedAt: order.authorized_at,
          authorizationNotes: order.authorization_notes,
          aiAnalysisResult: order.ai_analysis_result,
          aiConfidenceScore: order.ai_confidence_score ? parseFloat(order.ai_confidence_score.toString()) : null,
          aiAnalyzedAt: order.ai_analyzed_at,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          stats: {
            totalItems: 0,
            approvedItems: 0,
            rejectedItems: 0,
            pendingItems: 0
          }
        };
      });

      // Calcular estadísticas
      const stats = {
        totalOrders: total,
        pendingOrders: orders.filter(o => o.authorization_status === 'pending').length,
        approvedOrders: orders.filter(o => o.authorization_status === 'approved').length,
        rejectedOrders: orders.filter(o => o.authorization_status === 'rejected').length,
        totalEstimatedCost: orders.reduce((sum, o) => sum + (parseFloat(o.estimated_cost?.toString() || '0')), 0),
        totalApprovedCost: orders.reduce((sum, o) => sum + (parseFloat(o.approved_cost?.toString() || '0')), 0)
      };

      console.log('✅ getMedicalOrdersWithJoins completado exitosamente');

      return {
        data: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats
      };
    } catch (error) {
      console.error('❌ Error en getMedicalOrdersWithJoins:', error);
      throw new BadRequestException(`Error al obtener pedidos médicos: ${error.message}`);
    }
  }

  // Métodos auxiliares para detectar tipos de medicamentos
  private isCardiovascularMedication(itemName: string): boolean {
    const cardiovascularMeds = [
      'losartan', 'losartán', 'enalapril', 'captopril', 'amlodipino', 'nifedipino',
      'atenolol', 'metoprolol', 'propranolol', 'carvedilol', 'bisoprolol',
      'furosemida', 'hidroclorotiazida', 'espironolactona', 'atorvastatina',
      'simvastatina', 'rosuvastatina', 'clopidogrel', 'aspirina cardiovascular'
    ];
    return cardiovascularMeds.some(med => itemName.toLowerCase().includes(med));
  }

  private isAntibiotic(itemName: string): boolean {
    const antibiotics = [
      'amoxicilina', 'azitromicina', 'claritromicina', 'ciprofloxacina',
      'cefalexina', 'cefadroxilo', 'doxiciclina', 'eritromicina',
      'levofloxacina', 'penicilina', 'ampicilina', 'clindamicina'
    ];
    return antibiotics.some(antibiotic => itemName.toLowerCase().includes(antibiotic));
  }

  private isMedication(item: any): boolean {
    return item.item_type === 'medication' || 
           item.item_name?.toLowerCase().includes('mg') ||
           item.item_name?.toLowerCase().includes('ml') ||
           item.concentration;
  }

  // Métodos para análisis de IA detallado
  async getAiAnalysis(orderId: string): Promise<any> {
    try {
      const analysis = await this.aiPersistenceService.getLatestAnalysis(orderId);
      if (!analysis) {
        throw new NotFoundException('No se encontró análisis de IA para este pedido');
      }
      return analysis;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener análisis de IA: ${error.message}`);
    }
  }

  async getAiAnalysisHistory(orderId: string): Promise<any[]> {
    try {
      return await this.aiPersistenceService.getAnalysisHistory(orderId);
    } catch (error) {
      throw new BadRequestException(`Error al obtener historial de análisis de IA: ${error.message}`);
    }
  }

  async getItemAiAnalysis(orderId: string, itemId: string): Promise<any> {
    try {
      const analysis = await this.aiPersistenceService.getLatestAnalysis(orderId);
      if (!analysis) {
        throw new NotFoundException('No se encontró análisis de IA para este pedido');
      }

      const itemAnalysis = analysis.itemAnalyses?.find(item => item.medicalOrderItemId === itemId);
      if (!itemAnalysis) {
        throw new NotFoundException('No se encontró análisis de IA para este artículo');
      }

      return itemAnalysis;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener análisis de IA del artículo: ${error.message}`);
    }
  }
} 