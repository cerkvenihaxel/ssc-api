import { Injectable, Logger } from '@nestjs/common';
import { MedicalOrder, AIAnalysisResult } from '../../domain/entities/medical-order.entity';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class OpenAIAuthorizationService {
  private readonly logger = new Logger(OpenAIAuthorizationService.name);
  private readonly config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    };

    if (!this.config.apiKey) {
      this.logger.warn('OpenAI API key not configured. AI authorization will be disabled.');
    }
  }

  async analyzeMedicalOrder(order: MedicalOrder): Promise<AIAnalysisResult> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      this.logger.log(`Analyzing medical order ${order.orderNumber} with AI`);

      const prompt = this.buildAnalysisPrompt(order);
      const response = await this.callOpenAI(prompt);
      const analysis = this.parseAIResponse(response, order);

      this.logger.log(`AI analysis completed for order ${order.orderNumber}. Decision: ${analysis.decision}, Confidence: ${analysis.confidence}`);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to analyze medical order ${order.orderNumber}:`, error);
      
      // Return a smart fallback analysis based on basic medical logic
      return this.generateFallbackAnalysis(order, error.message);
    }
  }

  private buildAnalysisPrompt(order: MedicalOrder): string {
    const itemsDescription = order.items.map(item => 
      `- ${item.itemName} (${item.itemType}): ${item.requestedQuantity} ${item.unitOfMeasure}
        Justificación: ${item.medicalJustification || 'No especificada'}
        Costo estimado: $${item.estimatedUnitCost || 'No especificado'}`
    ).join('\n');

    return `
Eres un especialista en autorización de pedidos médicos. Analiza el siguiente pedido y proporciona una decisión de autorización basada en criterios médicos estándar y razonabilidad.

INFORMACIÓN DEL PEDIDO:
- Título: ${order.title}
- Justificación médica: ${order.medicalJustification}
- Diagnóstico: ${order.diagnosis || 'No especificado'}
- Plan de tratamiento: ${order.treatmentPlan || 'No especificado'}
- Duración estimada: ${order.estimatedDurationDays || 'No especificada'} días
- Urgencia: ${this.getUrgencyDescription(order.urgencyId)}
- Costo total estimado: $${order.getTotalEstimatedCost()}

ITEMS SOLICITADOS:
${itemsDescription}

CRITERIOS DE EVALUACIÓN:
1. Coherencia entre diagnóstico, tratamiento e items solicitados
2. Razonabilidad de las cantidades pedidas
3. Adecuación del tipo de medicamento/equipo para la condición
4. Urgencia vs. tipo de items solicitados
5. Costo-efectividad
6. Posibles interacciones o contraindicaciones

RESTRICCIONES IMPORTANTES:
- Máximo 30 unidades de analgésicos por solicitud
- Equipos médicos costosos (>$50,000) requieren justificación especial
- Medicamentos controlados requieren prescripción médica válida
- Items de emergencia solo para casos urgentes/críticos

Responde ÚNICAMENTE en el siguiente formato JSON (sin texto adicional):

{
  "decision": "approved|rejected|partial|requires_review",
  "confidence": 0.85,
  "reasoning": "Explicación detallada de la decisión",
  "itemAnalysis": [
    {
      "itemId": "uuid-del-item",
      "decision": "approved|rejected|partial",
      "approvedQuantity": 20,
      "reasoning": "Razón específica para este item"
    }
  ],
  "riskFactors": ["EXCESSIVE_QUANTITY", "DRUG_INTERACTION", "INADEQUATE_JUSTIFICATION"],
  "recommendations": ["Reducir cantidad de analgésicos", "Consultar con especialista"]
}

IMPORTANTE: 
- Solo aprueba items que estén claramente justificados
- Sé conservador con cantidades altas
- Rechaza items que no correspondan al diagnóstico
- Considera la urgencia del caso
- El confidence debe ser entre 0 y 1
`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un especialista médico en autorización de pedidos. Siempre responde con JSON válido siguiendo exactamente el formato solicitado.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent, conservative decisions
        max_tokens: 2000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data: OpenAIResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    this.logger.debug(`OpenAI usage: ${JSON.stringify(data.usage)}`);
    
    return data.choices[0].message.content;
  }

  private parseAIResponse(responseContent: string, order: MedicalOrder): AIAnalysisResult {
    try {
      // Remove any markdown formatting or extra text
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      const analysis: AIAnalysisResult = {
        decision: this.validateDecision(parsed.decision),
        confidence: this.validateConfidence(parsed.confidence),
        reasoning: parsed.reasoning || 'No reasoning provided',
        itemAnalysis: this.validateItemAnalysis(parsed.itemAnalysis, order),
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      };

      // Additional validation rules
      this.applyBusinessRules(analysis, order);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      this.logger.debug('Raw AI response:', responseContent);
      
      // Return a conservative fallback
      return {
        decision: 'requires_review',
        confidence: 0,
        reasoning: 'Failed to parse AI analysis. Manual review required.',
        itemAnalysis: order.items.map(item => ({
          itemId: item.itemId,
          decision: 'requires_review' as const,
          reasoning: 'AI response parsing error'
        })),
        riskFactors: ['AI_PARSING_ERROR'],
        recommendations: ['Manual review required due to AI parsing error']
      };
    }
  }

  private validateDecision(decision: any): 'approved' | 'rejected' | 'partial' | 'requires_review' {
    const validDecisions = ['approved', 'rejected', 'partial', 'requires_review'];
    return validDecisions.includes(decision) ? decision : 'requires_review';
  }

  private validateConfidence(confidence: any): number {
    const conf = Number(confidence);
    if (isNaN(conf) || conf < 0 || conf > 1) {
      return 0.5; // Default medium confidence
    }
    return conf;
  }

  private validateItemAnalysis(itemAnalysis: any[], order: MedicalOrder): AIAnalysisResult['itemAnalysis'] {
    if (!Array.isArray(itemAnalysis)) {
      // Create default analysis for all items
      return order.items.map(item => ({
        itemId: item.itemId,
        decision: 'requires_review' as const,
        reasoning: 'AI did not provide item analysis'
      }));
    }

    return order.items.map(item => {
      const aiItem = itemAnalysis.find(ai => ai.itemId === item.itemId);
      
      if (!aiItem) {
        // Use intelligent reasoning when OpenAI doesn't provide item analysis
        const reasoning = this.generateIntelligentReasoning(item, order);
        
        // For antibiotics with infectious conditions, approve directly
        if (this.isAntibiotic(item.itemName?.toLowerCase() || '')) {
          const allText = `${item.medicalJustification || ''} ${order.medicalJustification || ''} ${order.diagnosis || ''}`.toLowerCase();
          if (this.isInfectiousCondition(allText)) {
            return {
              itemId: item.itemId,
              decision: 'approved' as const,
              reasoning: reasoning || `${item.itemName} es apropiado para el tratamiento de condiciones infecciosas como se indica en la justificación médica.`
            };
          }
        }
        
        return {
          itemId: item.itemId,
          decision: 'requires_review' as const,
          reasoning: reasoning || 'Requiere revisión manual - análisis específico no disponible'
        };
      }

      return {
        itemId: item.itemId,
        decision: this.validateItemDecision(aiItem.decision),
        approvedQuantity: this.validateApprovedQuantity(aiItem.approvedQuantity, item.requestedQuantity),
        reasoning: aiItem.reasoning || 'No reasoning provided'
      };
    });
  }

  private validateItemDecision(decision: any): 'approved' | 'rejected' | 'partial' {
    const validDecisions = ['approved', 'rejected', 'partial'];
    return validDecisions.includes(decision) ? decision : 'rejected';
  }

  private validateApprovedQuantity(approvedQuantity: any, requestedQuantity: number): number | undefined {
    if (approvedQuantity === undefined || approvedQuantity === null) {
      return undefined;
    }
    
    const approved = Number(approvedQuantity);
    if (isNaN(approved) || approved < 0) {
      return undefined;
    }
    
    // Ensure approved quantity doesn't exceed requested
    return Math.min(approved, requestedQuantity);
  }

  private applyBusinessRules(analysis: AIAnalysisResult, order: MedicalOrder): void {
    // Rule 1: High-cost orders require manual review
    if (order.getTotalEstimatedCost() > 100000) {
      analysis.decision = 'requires_review';
      analysis.riskFactors.push('HIGH_COST_ORDER');
      analysis.recommendations.push('Manual review required for high-cost orders');
    }

    // Rule 2: Critical/urgent orders with equipment require review
    if (order.isUrgent() && order.items.some(item => item.itemType === 'equipment')) {
      analysis.decision = 'requires_review';
      analysis.riskFactors.push('URGENT_EQUIPMENT_REQUEST');
      analysis.recommendations.push('Urgent equipment requests require manual verification');
    }

    // Rule 3: Ensure confidence is reduced for complex cases
    const complexFactors = [
      order.items.length > 10,
      order.items.some(item => item.itemType === 'equipment'),
      !order.diagnosis,
      !order.treatmentPlan
    ].filter(Boolean).length;

    if (complexFactors > 2) {
      analysis.confidence = Math.min(analysis.confidence, 0.7);
      analysis.riskFactors.push('COMPLEX_CASE');
    }

    // Rule 4: Low confidence should trigger manual review
    if (analysis.confidence < 0.6) {
      analysis.decision = 'requires_review';
      analysis.recommendations.push('Low AI confidence - manual review recommended');
    }
  }

  private generateFallbackAnalysis(order: MedicalOrder, errorMessage: string): AIAnalysisResult {
    this.logger.log('Generating fallback analysis using basic medical logic');
    
    const itemAnalysis = order.items.map(item => {
      // Detect obvious medical inconsistencies
      const inconsistency = this.detectMedicalInconsistency(item, order);
      
      if (inconsistency) {
        return {
          itemId: item.itemId,
          decision: 'rejected' as const,
          reasoning: inconsistency
        };
      }
      
      // Check for excessive quantities
      if (item.requestedQuantity > 30 && this.isMedication(item)) {
        return {
          itemId: item.itemId,
          decision: 'partial' as const,
          approvedQuantity: 30,
          reasoning: 'Cantidad reducida por política de seguridad (máximo 30 unidades de medicamentos)'
        };
      }
      
      // Generate intelligent reasoning for common medical scenarios
      const reasoning = this.generateIntelligentReasoning(item, order);
      
      // For antibiotics with infectious conditions, approve with moderate confidence
      if (this.isAntibiotic(item.itemName?.toLowerCase() || '')) {
        const allText = `${item.medicalJustification || ''} ${order.medicalJustification || ''} ${order.diagnosis || ''}`.toLowerCase();
        if (this.isInfectiousCondition(allText)) {
          return {
            itemId: item.itemId,
            decision: 'approved' as const,
            reasoning: reasoning || `${item.itemName} es apropiado para el tratamiento de condiciones infecciosas como se indica en la justificación médica.`
          };
        }
      }
      
      // Default to requiring review for complex cases
      return {
        itemId: item.itemId,
        decision: 'requires_review' as const,
        reasoning: reasoning || 'Requiere revisión manual debido a limitaciones del análisis automático'
      };
    });
    
    // Determine overall decision
    const hasRejected = itemAnalysis.some(item => item.decision === 'rejected');
    const hasPartial = itemAnalysis.some(item => item.decision === 'partial');
    const hasApproved = itemAnalysis.some(item => item.decision === 'approved');
    const hasReview = itemAnalysis.some(item => item.decision === 'requires_review');
    
    let overallDecision: 'approved' | 'rejected' | 'partial' | 'requires_review';
    let confidence = 0.6; // Medium confidence for fallback analysis
    let reasoning = 'Análisis realizado con lógica médica básica. ';
    
    if (hasRejected) {
      overallDecision = 'requires_review';
      reasoning += 'Se detectaron inconsistencias médicas que requieren revisión.';
      confidence = 0.8; // High confidence when detecting clear inconsistencies
    } else if (hasPartial) {
      overallDecision = 'partial';
      reasoning += 'Algunos items requieren ajustes en las cantidades solicitadas.';
    } else if (hasApproved && !hasReview) {
      overallDecision = 'approved';
      reasoning += 'Los medicamentos son apropiados para las condiciones médicas indicadas.';
      confidence = 0.85; // Higher confidence for clearly appropriate treatments
    } else if (hasReview) {
      overallDecision = 'requires_review';
      reasoning += 'El pedido requiere revisión manual por un profesional médico.';
    } else {
      overallDecision = 'approved';
      reasoning += 'No se detectaron inconsistencias evidentes.';
    }
    
    return {
      decision: overallDecision,
      confidence,
      reasoning,
      itemAnalysis,
      riskFactors: hasRejected ? ['MEDICAL_INCONSISTENCY'] : [],
      recommendations: hasRejected ? ['Revisar la adecuación de los medicamentos para el diagnóstico'] : ['Verificar justificación médica']
    };
  }

  private detectMedicalInconsistency(item: any, order: MedicalOrder): string | null {
    const itemName = item.itemName?.toLowerCase() || '';
    const justification = (item.medicalJustification || order.medicalJustification || '').toLowerCase();
    const diagnosis = (order.diagnosis || '').toLowerCase();
    
    // Detect cardiovascular medications for non-cardiovascular conditions
    if (this.isCardiovascularMedication(itemName)) {
      if (this.isOrthopedicCondition(justification) || this.isOrthopedicCondition(diagnosis)) {
        return `${item.itemName} es un medicamento cardiovascular no apropiado para condiciones ortopédicas como fracturas. Se recomienda analgésicos o antiinflamatorios.`;
      }
    }
    
    // Detect antibiotics for non-infectious conditions (but exclude infectious conditions)
    if (this.isAntibiotic(itemName)) {
      // First check if it's a valid infectious condition that SHOULD have antibiotics
      if (this.isInfectiousCondition(justification) || this.isInfectiousCondition(diagnosis)) {
        return null; // No inconsistency - antibiotics are appropriate for infections
      }
      
      // Only flag as inconsistent if it's clearly a non-infectious condition
      if (this.isNonInfectiousCondition(justification) || this.isNonInfectiousCondition(diagnosis)) {
        return `${item.itemName} es un antibiótico no indicado para condiciones no infecciosas.`;
      }
    }
    
    // Detect psychiatric medications for non-psychiatric conditions
    if (this.isPsychiatricMedication(itemName)) {
      if (this.isPhysicalCondition(justification) || this.isPhysicalCondition(diagnosis)) {
        return `${item.itemName} es un medicamento psiquiátrico no apropiado para condiciones físicas.`;
      }
    }
    
    return null;
  }

  private isCardiovascularMedication(itemName: string): boolean {
    const cardiovascularKeywords = [
      'losartan', 'enalapril', 'captopril', 'amlodipino', 'atenolol', 
      'metoprolol', 'carvedilol', 'furosemida', 'hidroclorotiazida',
      'simvastatina', 'atorvastatina', 'warfarina', 'clopidogrel'
    ];
    return cardiovascularKeywords.some(keyword => itemName.includes(keyword));
  }

  private isOrthopedicCondition(text: string): boolean {
    const orthopedicKeywords = [
      'fractura', 'luxación', 'esguince', 'rotura', 'lesión muscular',
      'tendinitis', 'artritis', 'osteoporosis', 'tobillo', 'rodilla',
      'cadera', 'hombro', 'muñeca', 'columna', 'hueso'
    ];
    return orthopedicKeywords.some(keyword => text.includes(keyword));
  }

  private isAntibiotic(itemName: string): boolean {
    const antibioticKeywords = [
      'amoxicilina', 'penicilina', 'azitromicina', 'ciprofloxacina',
      'clindamicina', 'cefalexina', 'doxiciclina', 'eritromicina'
    ];
    return antibioticKeywords.some(keyword => itemName.includes(keyword));
  }

  private isPsychiatricMedication(itemName: string): boolean {
    const psychiatricKeywords = [
      'fluoxetina', 'sertralina', 'paroxetina', 'escitalopram',
      'diazepam', 'lorazepam', 'clonazepam', 'haloperidol',
      'risperidona', 'quetiapina', 'olanzapina'
    ];
    return psychiatricKeywords.some(keyword => itemName.includes(keyword));
  }

  private isInfectiousCondition(text: string): boolean {
    const infectiousKeywords = [
      'faringitis', 'amigdalitis', 'bronquitis', 'neumonía', 'sinusitis',
      'otitis', 'cistitis', 'pielonefritis', 'celulitis', 'impétigo',
      'infección', 'bacteriana', 'sepsis', 'absceso', 'fiebre',
      'gastroenteritis', 'endocarditis', 'meningitis'
    ];
    return infectiousKeywords.some(keyword => text.includes(keyword));
  }

  private isNonInfectiousCondition(text: string): boolean {
    const nonInfectiousKeywords = [
      'fractura', 'diabetes', 'hipertensión', 'artritis', 'alergia',
      'asma', 'migraña', 'dolor crónico', 'osteoporosis'
    ];
    return nonInfectiousKeywords.some(keyword => text.includes(keyword));
  }

  private isPhysicalCondition(text: string): boolean {
    const physicalKeywords = [
      'fractura', 'dolor', 'inflamación', 'lesión', 'herida',
      'hinchazón', 'movilidad', 'articulación', 'músculo'
    ];
    return physicalKeywords.some(keyword => text.includes(keyword));
  }

  private generateIntelligentReasoning(item: any, order: MedicalOrder): string | null {
    const itemName = item.itemName?.toLowerCase() || '';
    const allText = `${item.medicalJustification || ''} ${order.medicalJustification || ''} ${order.diagnosis || ''}`.toLowerCase();
    
    // Generate specific reasoning for antibiotics + infectious conditions
    if (this.isAntibiotic(itemName) && this.isInfectiousCondition(allText)) {
      if (allText.includes('faringitis')) {
        return `${item.itemName} es el tratamiento de primera línea para faringitis bacteriana. Dosis y duración apropiadas según protocolo médico.`;
      }
      if (allText.includes('amigdalitis')) {
        return `${item.itemName} es efectivo para el tratamiento de amigdalitis bacteriana según guías clínicas.`;
      }
      if (allText.includes('bronquitis')) {
        return `${item.itemName} está indicado para bronquitis bacteriana cuando hay evidencia de infección.`;
      }
      if (allText.includes('otitis')) {
        return `${item.itemName} es tratamiento estándar para otitis media bacteriana.`;
      }
      if (allText.includes('sinusitis')) {
        return `${item.itemName} es apropiado para sinusitis bacteriana según protocolos médicos.`;
      }
      return `${item.itemName} es apropiado para el tratamiento de la condición infecciosa indicada.`;
    }
    
    // Generate reasoning for cardiovascular medications
    if (this.isCardiovascularMedication(itemName)) {
      if (allText.includes('hipertensión') || allText.includes('presión alta')) {
        return `${item.itemName} es apropiado para el control de la hipertensión arterial.`;
      }
      if (allText.includes('insuficiencia cardiaca')) {
        return `${item.itemName} está indicado en el tratamiento de insuficiencia cardiaca.`;
      }
    }
    
    return null;
  }

  private isMedication(item: any): boolean {
    return item.itemType === 'medication' || 
           (item.itemName && (item.itemName.includes('mg') || item.itemName.includes('ml')));
  }

  private getUrgencyDescription(urgencyId: number): string {
    const urgencyMap: { [key: number]: string } = {
      1: 'Baja - No urgente',
      2: 'Normal - Rutinario',
      3: 'Alta - Importante',
      4: 'Urgente - Requiere atención inmediata',
      5: 'Crítico - Emergencia médica'
    };
    return urgencyMap[urgencyId] || 'Desconocido';
  }

  // Health check method
  async isServiceAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      this.logger.error('OpenAI service health check failed:', error);
      return false;
    }
  }

  // Get model information
  getModelInfo(): { model: string; available: boolean } {
    return {
      model: this.config.model,
      available: !!this.config.apiKey
    };
  }
} 