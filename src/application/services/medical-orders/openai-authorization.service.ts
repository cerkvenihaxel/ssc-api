import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { MedicalOrder } from '../../../domain/entities/medical-order.entity';

export interface AIAnalysisResult {
  decision: 'approved' | 'rejected' | 'partial' | 'requires_review';
  confidence: number;
  reasoning: string;
  itemAnalysis: {
    itemId: string;
    decision: 'approved' | 'rejected' | 'partial' | 'requires_review';
    approvedQuantity?: number;
    reasoning: string;
  }[];
  riskFactors: string[];
  recommendations: string[];
}

@Injectable()
export class OpenAIAuthorizationService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI analysis will be disabled.');
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  async analyzeMedicalOrder(order: MedicalOrder): Promise<AIAnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI service not available');
    }

    try {
      const prompt = this.createAnalysisPrompt(order);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un especialista en autorización de pedidos médicos. Responde siempre con JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent, conservative responses
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse and validate the JSON response
      const aiResult = this.parseAIResponse(response);
      
      // Apply business rules and safety checks
      return this.applyBusinessRules(aiResult, order);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      
      // Fallback to conservative analysis
      return this.getFallbackAnalysis(order);
    }
  }

  private createAnalysisPrompt(order: MedicalOrder): string {
    const itemsDescription = order.items.map(item => 
      `- ${item.itemName} (Código: ${item.itemCode || 'N/A'}): ${item.requestedQuantity} unidades a $${item.estimatedUnitCost || 0} c/u (Total: $${(item.estimatedUnitCost || 0) * item.requestedQuantity})\n  Justificación: ${item.medicalJustification || 'Sin justificación específica'}`
    ).join('\n');

    return `
ANÁLISIS DE PEDIDO MÉDICO - SISTEMA SSC

Eres un especialista en autorización de pedidos médicos con amplia experiencia en evaluación de solicitudes de insumos, medicamentos y equipamiento médico. Tu función es analizar pedidos y determinar si son médicamente justificados, razonables y cumplen con los protocolos estándar.

=== INFORMACIÓN DEL PEDIDO ===
Número de Pedido: ${order.orderNumber}
Afiliado: ${order.affiliateId || 'No especificado'}
Obra Social: ${order.healthcareProviderId || 'No especificada'}
Solicitante: ${order.requesterId} (${order.requesterType})
Urgencia: ${order.urgencyId}
Justificación Médica: ${order.medicalJustification}
Observaciones: ${order.description || 'Ninguna'}

=== ARTÍCULOS SOLICITADOS ===
${itemsDescription}

TOTAL DEL PEDIDO: $${order.getTotalEstimatedCost()}

=== PARÁMETROS DE EVALUACIÓN ===
Evalúa cada aspecto del pedido considerando:

1. JUSTIFICACIÓN MÉDICA:
   - ¿La condición médica descrita justifica los artículos solicitados?
   - ¿La justificación es específica y detallada?
   - ¿Coincide la urgencia con la condición médica?

2. CANTIDADES SOLICITADAS:
   - ¿Las cantidades son apropiadas para la condición médica?
   - ¿Están dentro de rangos estándar para procedimientos similares?
   - ¿Hay cantidades excesivas o insuficientes?

3. COSTO-BENEFICIO:
   - ¿El costo total es razonable para el tratamiento?
   - ¿Hay alternativas más económicas disponibles?
   - ¿El costo está justificado por la urgencia?

4. PROTOCOLOS MÉDICOS:
   - ¿Los artículos son estándar para la condición?
   - ¿Siguen protocolos médicos establecidos?
   - ¿Hay incompatibilidades o redundancias?

5. BANDERAS ROJAS:
   - Cantidades inusuales (ej: más de 20-30 clips para fracturas costales)
   - Costos excesivos sin justificación clara
   - Artículos no relacionados con la condición
   - Urgencia inconsistente con la justificación
   - Falta de justificación específica

=== RANGOS DE REFERENCIA MÉDICA ===
- Clips de fijación ósea: 2-30 unidades según tipo de fractura
- Suturas: 2-10 unidades por procedimiento estándar
- Drenajes: 1-3 unidades según complejidad
- Medicamentos: dosis estándar según peso/edad del paciente
- Equipamiento: 1 unidad por procedimiento salvo excepciones

=== LÍMITES DE AUTORIZACIÓN AUTOMÁTICA ===
- Pedidos hasta $50,000: pueden ser aprobados automáticamente si cumplen criterios
- Pedidos $50,001-$150,000: requieren análisis detallado
- Pedidos >$150,000: siempre requieren revisión manual
- Urgencia CRÍTICA: puede justificar costos elevados
- Múltiples artículos del mismo tipo: requiere justificación específica

INSTRUCCIONES DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:

{
  "decision": "approved" | "rejected" | "partial" | "requires_review",
  "confidence": number (0.0 a 1.0),
  "reasoning": "Explicación detallada de la decisión en español",
  "itemAnalysis": [
    {
      "itemId": "string",
      "decision": "approved" | "rejected" | "partial" | "requires_review",
      "approvedQuantity": number (solo si decision es approved),
      "reasoning": "Justificación específica para este artículo"
    }
  ],
  "riskFactors": [
    "Lista de factores de riesgo identificados"
  ],
  "recommendations": [
    "Lista de recomendaciones para el médico/administrador"
  ]
}

CRITERIOS DE DECISIÓN:
- approved: Pedido completamente justificado, cantidades apropiadas, costo razonable
- rejected: Problemas graves de justificación, cantidades excesivas, costo injustificado
- partial: Casos límite, requiere evaluación humana especializada
- requires_review: Pedido no justificado, necesita revisión manual

IMPORTANTE: 
- Sé conservador en las aprobaciones automáticas
- Considera siempre la seguridad del paciente
- Justifica claramente cada decisión
- Si hay dudas, recomienda requires_review
- No apruebes pedidos con justificaciones vagas o incompletas
- Considera el contexto de urgencia pero no comprometas la evaluación médica

Analiza el pedido y proporciona tu evaluación:
`;
  }

  private parseAIResponse(response: string): AIAnalysisResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.decision || !parsed.confidence || !parsed.reasoning) {
        throw new Error('Missing required fields in AI response');
      }

      return parsed as AIAnalysisResult;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private applyBusinessRules(aiResult: AIAnalysisResult, order: MedicalOrder): AIAnalysisResult {
    // Business rules override
    const result = { ...aiResult };

    // High cost orders always need review
    if (order.getTotalEstimatedCost() > 150000) {
      result.decision = 'requires_review';
      result.riskFactors.push('Costo superior a $150,000 requiere revisión manual');
    }

    // Low confidence always needs review
    if (result.confidence < 0.7) {
      result.decision = 'requires_review';
      result.riskFactors.push('Confianza de IA menor al 70%');
    }

    // Critical urgency with high cost needs review
    if (order.urgencyId >= 5 && order.getTotalEstimatedCost() > 100000) {
      result.decision = 'requires_review';
      result.riskFactors.push('Urgencia crítica con costo elevado requiere revisión');
    }

    // Ensure confidence is within bounds
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    return result;
  }

  private getFallbackAnalysis(order: MedicalOrder): AIAnalysisResult {
    // Conservative fallback when AI fails
    return {
      decision: 'requires_review',
      confidence: 0.0,
      reasoning: 'Error en análisis automático. Se requiere revisión manual por parte del equipo médico.',
      itemAnalysis: order.items.map(item => ({
        itemId: item.itemId,
        decision: 'requires_review' as const,
        reasoning: 'Requiere evaluación manual debido a falla en análisis automático'
      })),
      riskFactors: [
        'Falla en análisis automático',
        'Requiere revisión manual completa'
      ],
      recommendations: [
        'Revisar manualmente todos los artículos',
        'Verificar justificación médica con profesional',
        'Evaluar alternativas de menor costo'
      ]
    };
  }

  async getAuthorizationParameters(): Promise<any> {
    // Mock data for authorization parameters
    return {
      maxAutomaticAmount: 50000,
      maxReviewAmount: 150000,
      urgencyMultipliers: {
        LOW: 1.0,
        MEDIUM: 1.2,
        HIGH: 1.5,
        URGENT: 2.0,
        CRITICAL: 3.0
      },
      categoryLimits: {
        CLIPS: { max: 30, unitCost: 1000 },
        SUTURES: { max: 10, unitCost: 500 },
        DRAINS: { max: 3, unitCost: 1200 },
        MEDICATIONS: { max: 100, unitCost: 200 }
      }
    };
  }
} 