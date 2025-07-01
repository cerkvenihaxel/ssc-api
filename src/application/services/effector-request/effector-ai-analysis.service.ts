import { Injectable, Inject } from '@nestjs/common';
import { EffectorRequest } from '../../../domain/models/effector-request/effector-request.model';
import { OpenAIAuthorizationService } from '../../../infrastructure/services/openai-authorization.service';

export interface EffectorRequestAIAnalysis {
  decision: 'approved' | 'rejected' | 'partial' | 'needs_review';
  confidence: number;
  reasoning: string;
  itemAnalyses: {
    itemId: string;
    decision: 'approved' | 'rejected' | 'partial' | 'requires_review';
    reasoning: string;
    approvedQuantity?: number;
    medicalAppropriatenessScore: number;
    quantityJustificationScore: number;
    costEffectivenessScore: number;
    urgencyAppropriatenessScore: number;
    hasBudgetConcern: boolean;
    hasQuantityConcern: boolean;
    hasUrgencyConcern: boolean;
    hasSpecificationConcern: boolean;
    suggestions: string[];
  }[];
  overallAnalysis: {
    totalBudgetImpact: number;
    epidemiologicalCoherence: number;
    institutionalCapacityScore: number;
    beneficiaryRatio: number;
    priorityJustificationScore: number;
  };
  riskFactors: string[];
  recommendations: string[];
  budgetOptimizationSuggestions: string[];
  requiresSpecialAuthorization: boolean;
  recommendedApprovalLevel: 'automatic' | 'supervisor' | 'medical_director' | 'administrative_director';
}

@Injectable()
export class EffectorAIAnalysisService {
  constructor(
    @Inject('OpenAIAuthorizationService')
    private readonly openAIService: OpenAIAuthorizationService,
  ) {}

  async analyzeEffectorRequest(request: EffectorRequest): Promise<EffectorRequestAIAnalysis> {
    try {
      // Convert EffectorRequest to a format compatible with the existing OpenAI service
      const medicalOrderFormat = this.convertToMedicalOrderFormat(request);
      const openAIResponse = await this.openAIService.analyzeMedicalOrder(medicalOrderFormat);
      
      return this.convertToEffectorAnalysis(openAIResponse, request);
    } catch (error) {
      console.error('Error analyzing effector request with AI:', error);
      // Return conservative fallback analysis
      return this.getConservativeFallbackAnalysis(request);
    }
  }

  private convertToMedicalOrderFormat(request: EffectorRequest): any {
    // Convert effector request to medical order format for analysis
    return {
      orderId: request.request_id,
      orderNumber: request.request_number,
      requesterId: request.effector_id,
      requesterType: 'admin',
      title: request.title,
      description: request.description,
      medicalJustification: (request as any).clinical_justification || request.description || 'Pedido institucional',
      diagnosis: (request as any).epidemiological_context || 'Necesidad institucional',
      treatmentPlan: (request as any).medical_area || 'Atención médica general',
      items: (request.items || []).map(item => ({
        itemId: item.item_id,
        itemName: item.article_name,
        itemCode: item.article_code,
        itemDescription: item.description,
        requestedQuantity: item.quantity,
        unitOfMeasure: item.unit_measure || 'unidad',
        itemType: 'medication',
        medicalJustification: (item as any).medical_justification || item.description,
        estimatedUnitCost: item.estimated_unit_price || 0,
        brand: null,
        presentation: null,
        concentration: null,
        administrationRoute: null
      })),
      estimatedCost: request.total_estimated_amount || 0,
      urgencyId: this.mapPriorityToUrgency(request.priority),
      createdAt: request.created_at,
      getTotalEstimatedCost: () => request.total_estimated_amount || 0,
      isUrgent: () => request.priority === 'URGENTE'
    };
  }

  private mapPriorityToUrgency(priority: string): number {
    const priorityMap: { [key: string]: number } = {
      'BAJA': 1,
      'NORMAL': 2,
      'ALTA': 3,
      'URGENTE': 4
    };
    return priorityMap[priority] || 2;
  }

  private convertToEffectorAnalysis(openAIResult: any, request: EffectorRequest): EffectorRequestAIAnalysis {
    return {
      decision: openAIResult.decision || 'needs_review',
      confidence: openAIResult.confidence || 0.5,
      reasoning: openAIResult.reasoning || 'Análisis completado',
      itemAnalyses: (openAIResult.itemAnalysis || []).map((item: any, index: number) => ({
        itemId: item.itemId || (request.items?.[index]?.item_id || ''),
        decision: item.decision || 'requires_review',
        reasoning: item.reasoning || 'Análisis automático',
        approvedQuantity: item.approvedQuantity,
        medicalAppropriatenessScore: 75,
        quantityJustificationScore: 70,
        costEffectivenessScore: 80,
        urgencyAppropriatenessScore: 75,
        hasBudgetConcern: (request.total_estimated_amount || 0) > 100000,
        hasQuantityConcern: (request.items?.[index]?.quantity || 0) > 1000,
        hasUrgencyConcern: request.priority === 'URGENTE',
        hasSpecificationConcern: false,
        suggestions: ['Verificar cantidades institucionales']
      })),
      overallAnalysis: {
        totalBudgetImpact: request.total_estimated_amount || 0,
        epidemiologicalCoherence: 75,
        institutionalCapacityScore: 80,
        beneficiaryRatio: 70,
        priorityJustificationScore: 75
      },
      riskFactors: openAIResult.riskFactors || [],
      recommendations: openAIResult.recommendations || [],
      budgetOptimizationSuggestions: ['Considerar compras por licitación', 'Evaluar alternativas genéricas'],
      requiresSpecialAuthorization: (request.total_estimated_amount || 0) > 500000,
      recommendedApprovalLevel: (request.total_estimated_amount || 0) > 500000 ? 'administrative_director' : 'supervisor'
    };
  }

  private buildAnalysisPrompt(request: EffectorRequest): string {
    const totalAmount = request.total_estimated_amount || 0;
    const itemsCount = request.items?.length || 0;
    
    return `
Analiza este pedido médico institucional de efector con criterio profesional:

INFORMACIÓN DEL EFECTOR:
- ID del efector: ${request.effector_id}
- Número de pedido: ${request.request_number}
- Título: ${request.title}
- Descripción: ${request.description || 'No especificada'}
- Prioridad: ${request.priority}
- Área médica: ${(request as any).medical_area || 'No especificada'}
- Departamento: ${(request as any).institution_department || 'No especificado'}
- Médico solicitante: ${(request as any).requesting_doctor || 'No especificado'}
- Beneficiarios estimados: ${(request as any).estimated_beneficiaries || 'No especificado'}
- Contexto epidemiológico: ${(request as any).epidemiological_context || 'No especificado'}

ANÁLISIS FINANCIERO:
- Monto total estimado: $${totalAmount.toLocaleString()}
- Cantidad de items: ${itemsCount}
- Promedio por item: $${itemsCount > 0 ? (totalAmount / itemsCount).toFixed(2) : '0'}

ITEMS SOLICITADOS:
${request.items?.map((item, index) => `
${index + 1}. ${item.article_name}
   - Código: ${item.article_code || 'N/A'}
   - Cantidad: ${item.quantity} ${item.unit_measure || 'unidades'}
   - Precio estimado unitario: $${item.estimated_unit_price?.toLocaleString() || 'No especificado'}
   - Precio total: $${item.estimated_total_price?.toLocaleString() || 'No especificado'}
   - Justificación médica: ${(item as any).medical_justification || 'No especificada'}
   - Indicación terapéutica: ${(item as any).therapeutic_indication || 'No especificada'}
   - Consumo mensual: ${(item as any).monthly_consumption || 'No especificado'}
   - Cantidad de pacientes: ${(item as any).patient_quantity || 'No especificado'}
   - Especificaciones técnicas: ${item.technical_specifications || 'No especificadas'}
   - Fecha de vencimiento: ${item.expiration_date || 'No especificada'}
`).join('') || 'No hay items especificados'}

CRITERIOS DE EVALUACIÓN INSTITUCIONAL:

1. APROPIACIÓN MÉDICA INSTITUCIONAL (0-100):
   - ¿Las cantidades son coherentes con el tamaño y tipo de institución?
   - ¿La justificación médica es apropiada para un efector de salud?
   - ¿Los medicamentos/insumos son apropiados para el área médica especificada?

2. JUSTIFICACIÓN DE CANTIDADES MASIVAS (0-100):
   - ¿Las cantidades están justificadas por el número de beneficiarios?
   - ¿El consumo mensual estimado es coherente con la cantidad solicitada?
   - ¿Existe justificación epidemiológica para estas cantidades?

3. COSTO-EFECTIVIDAD INSTITUCIONAL (0-100):
   - ¿Los precios son razonables para compras institucionales?
   - ¿Existe potencial de optimización de costos?
   - ¿Se justifica el impacto presupuestario?

4. URGENCIA Y PRIORIZACIÓN (0-100):
   - ¿La prioridad declarada se corresponde con los items solicitados?
   - ¿Existe justificación médica para la urgencia?
   - ¿Hay contexto epidemiológico que justifique la urgencia?

REGLAS DE NEGOCIO ESPECÍFICAS:
- Pedidos >$500,000 requieren autorización especial
- Cantidades masivas (>1000 unidades de un item) requieren justificación especial
- Medicamentos controlados requieren documentación especial
- Equipamiento médico >$100,000 requiere evaluación técnica

RESPONDE EN FORMATO JSON EXACTO:
{
  "decision": "approved|rejected|partial|needs_review",
  "confidence": 0.85,
  "reasoning": "Análisis detallado del pedido institucional...",
  "itemAnalyses": [
    {
      "itemId": "item_uuid",
      "decision": "approved|rejected|partial|requires_review",
      "reasoning": "Justificación específica del item...",
      "approvedQuantity": 100,
      "medicalAppropriatenessScore": 85,
      "quantityJustificationScore": 75,
      "costEffectivenessScore": 90,
      "urgencyAppropriatenessScore": 80,
      "hasBudgetConcern": false,
      "hasQuantityConcern": true,
      "hasUrgencyConcern": false,
      "hasSpecificationConcern": false,
      "suggestions": ["Considerar reducir cantidad", "Verificar especificaciones"]
    }
  ],
  "overallAnalysis": {
    "totalBudgetImpact": 450000,
    "epidemiologicalCoherence": 85,
    "institutionalCapacityScore": 90,
    "beneficiaryRatio": 75,
    "priorityJustificationScore": 80
  },
  "riskFactors": ["Alto impacto presupuestario", "Cantidades no justificadas"],
  "recommendations": ["Revisar cantidades de medicamentos de alto costo"],
  "budgetOptimizationSuggestions": ["Considerar genéricos", "Negociar precios por volumen"],
  "requiresSpecialAuthorization": true,
  "recommendedApprovalLevel": "medical_director"
}`;
  }

  private parseOpenAIResponse(response: any, request: EffectorRequest): EffectorRequestAIAnalysis {
    try {
      // Si la respuesta ya es un objeto JSON
      const analysis = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Validar que tenga la estructura esperada
      return {
        decision: analysis.decision || 'needs_review',
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
        reasoning: analysis.reasoning || 'Análisis completado por IA',
        itemAnalyses: this.validateItemAnalyses(analysis.itemAnalyses || [], request),
        overallAnalysis: {
          totalBudgetImpact: analysis.overallAnalysis?.totalBudgetImpact || 0,
          epidemiologicalCoherence: Math.min(Math.max(analysis.overallAnalysis?.epidemiologicalCoherence || 50, 0), 100),
          institutionalCapacityScore: Math.min(Math.max(analysis.overallAnalysis?.institutionalCapacityScore || 50, 0), 100),
          beneficiaryRatio: Math.min(Math.max(analysis.overallAnalysis?.beneficiaryRatio || 50, 0), 100),
          priorityJustificationScore: Math.min(Math.max(analysis.overallAnalysis?.priorityJustificationScore || 50, 0), 100)
        },
        riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        budgetOptimizationSuggestions: Array.isArray(analysis.budgetOptimizationSuggestions) ? analysis.budgetOptimizationSuggestions : [],
        requiresSpecialAuthorization: Boolean(analysis.requiresSpecialAuthorization),
        recommendedApprovalLevel: this.validateApprovalLevel(analysis.recommendedApprovalLevel)
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return this.getConservativeFallbackAnalysis(request);
    }
  }

  private validateItemAnalyses(itemAnalyses: any[], request: EffectorRequest): any[] {
    const requestItems = request.items || [];
    
    return requestItems.map((item, index) => {
      const analysis = itemAnalyses[index] || {};
      
      return {
        itemId: item.item_id,
        decision: this.validateItemDecision(analysis.decision),
        reasoning: analysis.reasoning || 'Análisis automático',
        approvedQuantity: analysis.approvedQuantity || item.quantity,
        medicalAppropriatenessScore: Math.min(Math.max(analysis.medicalAppropriatenessScore || 50, 0), 100),
        quantityJustificationScore: Math.min(Math.max(analysis.quantityJustificationScore || 50, 0), 100),
        costEffectivenessScore: Math.min(Math.max(analysis.costEffectivenessScore || 50, 0), 100),
        urgencyAppropriatenessScore: Math.min(Math.max(analysis.urgencyAppropriatenessScore || 50, 0), 100),
        hasBudgetConcern: Boolean(analysis.hasBudgetConcern),
        hasQuantityConcern: Boolean(analysis.hasQuantityConcern),
        hasUrgencyConcern: Boolean(analysis.hasUrgencyConcern),
        hasSpecificationConcern: Boolean(analysis.hasSpecificationConcern),
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : []
      };
    });
  }

  private validateItemDecision(decision: string): 'approved' | 'rejected' | 'partial' | 'requires_review' {
    const validDecisions = ['approved', 'rejected', 'partial', 'requires_review'];
    return validDecisions.includes(decision) ? decision as any : 'requires_review';
  }

  private validateApprovalLevel(level: string): 'automatic' | 'supervisor' | 'medical_director' | 'administrative_director' {
    const validLevels = ['automatic', 'supervisor', 'medical_director', 'administrative_director'];
    return validLevels.includes(level) ? level as any : 'supervisor';
  }

  private getConservativeFallbackAnalysis(request: EffectorRequest): EffectorRequestAIAnalysis {
    const totalAmount = request.total_estimated_amount || 0;
    const hasLargeQuantities = (request.items || []).some(item => item.quantity > 1000);
    const requiresSpecialAuth = totalAmount > 500000 || request.priority === 'URGENTE' || hasLargeQuantities;
    
    return {
      decision: 'needs_review',
      confidence: 0.3,
      reasoning: 'Análisis automático no disponible. Se requiere revisión manual por seguridad.',
      itemAnalyses: (request.items || []).map(item => ({
        itemId: item.item_id,
        decision: 'requires_review' as const,
        reasoning: 'Requiere revisión manual',
        approvedQuantity: item.quantity,
        medicalAppropriatenessScore: 50,
        quantityJustificationScore: 50,
        costEffectivenessScore: 50,
        urgencyAppropriatenessScore: 50,
        hasBudgetConcern: totalAmount > 100000,
        hasQuantityConcern: item.quantity > 1000,
        hasUrgencyConcern: request.priority === 'URGENTE',
        hasSpecificationConcern: false,
        suggestions: ['Requiere validación manual']
      })),
      overallAnalysis: {
        totalBudgetImpact: totalAmount,
        epidemiologicalCoherence: 50,
        institutionalCapacityScore: 50,
        beneficiaryRatio: 50,
        priorityJustificationScore: 50
      },
      riskFactors: requiresSpecialAuth ? ['Alto impacto presupuestario o pedido prioritario'] : [],
      recommendations: ['Revisión manual requerida'],
      budgetOptimizationSuggestions: [],
      requiresSpecialAuthorization: requiresSpecialAuth,
      recommendedApprovalLevel: requiresSpecialAuth ? 'administrative_director' : 'supervisor'
    };
  }
} 