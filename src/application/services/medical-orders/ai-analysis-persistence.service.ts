import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMedicalOrderAnalysis, AnalysisDecision, AnalysisType } from '../../../entities/ai-medical-order-analysis.entity';
import { AiItemAnalysis, ItemDecision } from '../../../entities/ai-item-analysis.entity';
import { AiRiskFactor, RiskLevel, ClinicalSignificance } from '../../../entities/ai-risk-factor.entity';
import { AiRecommendation, RecommendationPriority, RecommendationStatus } from '../../../entities/ai-recommendation.entity';
import { AiCorrectionSuggestion, CorrectionStatus, ClinicalEvidenceLevel } from '../../../entities/ai-correction-suggestion.entity';
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
    medicalAppropriatenessScore?: number;
    dosageAppropriatenessScore?: number;
    costEffectivenessScore?: number;
    hasDrugInteraction?: boolean;
    hasDosageConcern?: boolean;
    hasMedicalInconsistency?: boolean;
    hasCostConcern?: boolean;
    alternativeSuggestions?: string;
    dosageRecommendations?: string;
  }[];
  riskFactors: {
    type: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedItems?: string[];
    clinicalSignificance?: 'minor' | 'moderate' | 'major' | 'contraindicated';
    requiresSpecialistReview?: boolean;
  }[];
  recommendations: {
    type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    description: string;
    suggestedAction?: string;
    targetItemIds?: string[];
  }[];
  metadata?: {
    modelVersion?: string;
    analysisType?: 'automatic' | 'fallback' | 'manual_review';
    processingTimeMs?: number;
    tokensUsed?: number;
    estimatedCost?: number;
    medicalSpecialty?: string;
    urgencyLevel?: number;
  };
}

export interface AIAnalysisQuery {
  medicalOrderId?: string;
  decision?: AnalysisDecision;
  confidenceMin?: number;
  confidenceMax?: number;
  analysisType?: AnalysisType;
  dateFrom?: Date;
  dateTo?: Date;
  hasRiskFactors?: boolean;
  riskLevel?: RiskLevel;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AiAnalysisPersistenceService {
  private readonly logger = new Logger(AiAnalysisPersistenceService.name);

  constructor(
    @InjectRepository(AiMedicalOrderAnalysis)
    private readonly analysisRepository: Repository<AiMedicalOrderAnalysis>,
    
    @InjectRepository(AiItemAnalysis)
    private readonly itemAnalysisRepository: Repository<AiItemAnalysis>,
    
    @InjectRepository(AiRiskFactor)
    private readonly riskFactorRepository: Repository<AiRiskFactor>,
    
    @InjectRepository(AiRecommendation)
    private readonly recommendationRepository: Repository<AiRecommendation>,
    
    @InjectRepository(AiCorrectionSuggestion)
    private readonly correctionSuggestionRepository: Repository<AiCorrectionSuggestion>,
  ) {}

  /**
   * Persiste un análisis completo de IA
   */
  async saveAnalysis(
    medicalOrderId: string,
    order: MedicalOrder,
    analysisResult: AIAnalysisResult,
    startTime?: Date
  ): Promise<AiMedicalOrderAnalysis> {
    const endTime = new Date();
    const processingTime = startTime ? endTime.getTime() - startTime.getTime() : undefined;

    try {
      // 1. Crear el análisis principal
      const analysis = this.analysisRepository.create({
        medicalOrderId,
        overallDecision: analysisResult.decision,
        confidenceScore: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        aiModelVersion: analysisResult.metadata?.modelVersion || 'gpt-4',
        analysisType: analysisResult.metadata?.analysisType || 'automatic',
        processingTimeMs: analysisResult.metadata?.processingTimeMs || processingTime,
        tokensUsed: analysisResult.metadata?.tokensUsed,
        estimatedCost: analysisResult.metadata?.estimatedCost,
        medicalSpecialty: analysisResult.metadata?.medicalSpecialty,
        urgencyLevel: analysisResult.metadata?.urgencyLevel,
        totalItemsAnalyzed: analysisResult.itemAnalysis?.length || 0,
        analyzedAt: endTime
      });

      const savedAnalysis = await this.analysisRepository.save(analysis);

      // 2. Guardar análisis por item
      if (analysisResult.itemAnalysis && analysisResult.itemAnalysis.length > 0) {
        await this.saveItemAnalyses(savedAnalysis.analysisId, analysisResult.itemAnalysis, order);
      }

      // 3. Guardar factores de riesgo
      if (analysisResult.riskFactors && analysisResult.riskFactors.length > 0) {
        await this.saveRiskFactors(savedAnalysis.analysisId, analysisResult.riskFactors);
      }

      // 4. Guardar recomendaciones
      if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
        await this.saveRecommendations(savedAnalysis.analysisId, analysisResult.recommendations);
      }

      this.logger.log(`Análisis de IA persistido exitosamente para pedido ${medicalOrderId}`);
      return savedAnalysis;

    } catch (error) {
      this.logger.error(`Error persistiendo análisis de IA para pedido ${medicalOrderId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el análisis más reciente de un pedido médico
   */
  async getLatestAnalysis(medicalOrderId: string): Promise<AiMedicalOrderAnalysis | null> {
    return await this.analysisRepository.findOne({
      where: { medicalOrderId },
      relations: ['itemAnalyses', 'riskFactors', 'recommendations', 'correctionSuggestions'],
      order: { analyzedAt: 'DESC' }
    });
  }

  /**
   * Obtiene todos los análisis de un pedido médico
   */
  async getAnalysisHistory(medicalOrderId: string): Promise<AiMedicalOrderAnalysis[]> {
    return await this.analysisRepository.find({
      where: { medicalOrderId },
      relations: ['itemAnalyses', 'riskFactors', 'recommendations', 'correctionSuggestions'],
      order: { analyzedAt: 'DESC' }
    });
  }

  /**
   * Obtiene el análisis de un item específico
   */
  async getItemAnalysis(medicalOrderId: string, itemId: string): Promise<AiItemAnalysis | null> {
    const latestAnalysis = await this.getLatestAnalysis(medicalOrderId);
    if (!latestAnalysis) {
      return null;
    }

    return await this.itemAnalysisRepository.findOne({
      where: {
        analysisId: latestAnalysis.analysisId,
        medicalOrderItemId: itemId
      }
    });
  }

  /**
   * Convierte el análisis persistido al formato legacy para compatibilidad
   */
  async getAnalysisInLegacyFormat(medicalOrderId: string): Promise<any | null> {
    const analysis = await this.getLatestAnalysis(medicalOrderId);
    if (!analysis) {
      return null;
    }

    return {
      decision: analysis.overallDecision,
      confidence: analysis.confidenceScore,
      reasoning: analysis.reasoning,
      itemAnalysis: analysis.itemAnalyses?.map(item => ({
        itemId: item.medicalOrderItemId,
        decision: item.itemDecision,
        approvedQuantity: item.approvedQuantity,
        reasoning: item.aiReasoning || item.rejectionReasoning,
        medicalAppropriatenessScore: item.medicalAppropriatenessScore,
        dosageAppropriatenessScore: item.dosageAppropriatenessScore,
        costEffectivenessScore: item.costEffectivenessScore,
        hasDrugInteraction: item.hasDrugInteraction,
        hasDosageConcern: item.hasDosageConcern,
        hasMedicalInconsistency: item.hasMedicalInconsistency,
        hasCostConcern: item.hasCostConcern,
        alternativeSuggestions: item.alternativeSuggestions,
        dosageRecommendations: item.dosageRecommendations
      })) || [],
      riskFactors: analysis.riskFactors?.map(risk => risk.description) || [],
      recommendations: analysis.recommendations?.map(rec => rec.description) || []
    };
  }

  /**
   * Busca análisis según criterios
   */
  async queryAnalyses(query: AIAnalysisQuery): Promise<{
    analyses: AiMedicalOrderAnalysis[];
    total: number;
  }> {
    const qb = this.analysisRepository.createQueryBuilder('analysis')
      .leftJoinAndSelect('analysis.itemAnalyses', 'items')
      .leftJoinAndSelect('analysis.riskFactors', 'risks')
      .leftJoinAndSelect('analysis.recommendations', 'recommendations');

    if (query.medicalOrderId) {
      qb.andWhere('analysis.medicalOrderId = :medicalOrderId', { medicalOrderId: query.medicalOrderId });
    }

    if (query.decision) {
      qb.andWhere('analysis.overallDecision = :decision', { decision: query.decision });
    }

    if (query.confidenceMin !== undefined) {
      qb.andWhere('analysis.confidenceScore >= :confidenceMin', { confidenceMin: query.confidenceMin });
    }

    if (query.confidenceMax !== undefined) {
      qb.andWhere('analysis.confidenceScore <= :confidenceMax', { confidenceMax: query.confidenceMax });
    }

    if (query.analysisType) {
      qb.andWhere('analysis.analysisType = :analysisType', { analysisType: query.analysisType });
    }

    if (query.dateFrom) {
      qb.andWhere('analysis.analyzedAt >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('analysis.analyzedAt <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.hasRiskFactors) {
      qb.andWhere('EXISTS (SELECT 1 FROM ai_risk_factors rf WHERE rf.analysis_id = analysis.analysis_id)');
    }

    if (query.riskLevel) {
      qb.andWhere('EXISTS (SELECT 1 FROM ai_risk_factors rf WHERE rf.analysis_id = analysis.analysis_id AND rf.risk_level = :riskLevel)', 
        { riskLevel: query.riskLevel });
    }

    const total = await qb.getCount();

    if (query.limit) {
      qb.limit(query.limit);
    }

    if (query.offset) {
      qb.offset(query.offset);
    }

    qb.orderBy('analysis.analyzedAt', 'DESC');

    const analyses = await qb.getMany();

    return { analyses, total };
  }

  /**
   * Obtiene estadísticas de análisis de IA
   */
  async getAnalysisStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalAnalyses: number;
    byDecision: Record<AnalysisDecision, number>;
    byAnalysisType: Record<AnalysisType, number>;
    averageConfidence: number;
    averageProcessingTime: number;
    totalCost: number;
    riskFactorStats: Record<string, number>;
  }> {
    const qb = this.analysisRepository.createQueryBuilder('analysis');

    if (dateFrom) {
      qb.andWhere('analysis.analyzedAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('analysis.analyzedAt <= :dateTo', { dateTo });
    }

    const analyses = await qb.getMany();

    const totalAnalyses = analyses.length;
    const byDecision = analyses.reduce((acc, analysis) => {
      acc[analysis.overallDecision] = (acc[analysis.overallDecision] || 0) + 1;
      return acc;
    }, {} as Record<AnalysisDecision, number>);

    const byAnalysisType = analyses.reduce((acc, analysis) => {
      acc[analysis.analysisType] = (acc[analysis.analysisType] || 0) + 1;
      return acc;
    }, {} as Record<AnalysisType, number>);

    const averageConfidence = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.confidenceScore, 0) / analyses.length 
      : 0;

    const averageProcessingTime = analyses.length > 0 
      ? analyses.filter(a => a.processingTimeMs).reduce((sum, a) => sum + (a.processingTimeMs || 0), 0) / 
        analyses.filter(a => a.processingTimeMs).length 
      : 0;

    const totalCost = analyses.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);

    // Obtener estadísticas de factores de riesgo
    const riskFactors = await this.riskFactorRepository.find();
    const riskFactorStats = riskFactors.reduce((acc, risk) => {
      acc[risk.riskType] = (acc[risk.riskType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAnalyses,
      byDecision,
      byAnalysisType,
      averageConfidence,
      averageProcessingTime,
      totalCost,
      riskFactorStats
    };
  }

  /**
   * Genera sugerencias de corrección basadas en análisis previos
   */
  async generateCorrectionSuggestions(
    medicalOrderId: string,
    analysisId: string,
    suggestions: {
      correctionType: string;
      targetField?: string;
      currentValue?: string;
      suggestedValue?: string;
      reasoning: string;
      confidence?: number;
      evidenceLevel?: ClinicalEvidenceLevel;
    }[]
  ): Promise<AiCorrectionSuggestion[]> {
    const correctionSuggestions = suggestions.map(suggestion => 
      this.correctionSuggestionRepository.create({
        originalAnalysisId: analysisId,
        medicalOrderId,
        correctionType: suggestion.correctionType,
        targetField: suggestion.targetField,
        currentValue: suggestion.currentValue,
        suggestedValue: suggestion.suggestedValue,
        correctionReasoning: suggestion.reasoning,
        confidenceScore: suggestion.confidence,
        clinicalEvidenceLevel: suggestion.evidenceLevel,
        status: 'pending'
      })
    );

    return await this.correctionSuggestionRepository.save(correctionSuggestions);
  }

  private async saveItemAnalyses(
    analysisId: string, 
    itemAnalyses: AIAnalysisResult['itemAnalysis'],
    order: MedicalOrder
  ): Promise<void> {
    const itemEntities = itemAnalyses.map(item => {
      const orderItem = order.items.find(oi => oi.itemId === item.itemId);
      
      return this.itemAnalysisRepository.create({
        analysisId,
        medicalOrderItemId: item.itemId,
        itemDecision: item.decision,
        requestedQuantity: orderItem?.requestedQuantity || 0,
        approvedQuantity: item.approvedQuantity,
        aiReasoning: item.reasoning,
        rejectionReasoning: item.decision === 'rejected' ? item.reasoning : undefined,
        medicalAppropriatenessScore: item.medicalAppropriatenessScore,
        dosageAppropriatenessScore: item.dosageAppropriatenessScore,
        costEffectivenessScore: item.costEffectivenessScore,
        hasDrugInteraction: item.hasDrugInteraction || false,
        hasDosageConcern: item.hasDosageConcern || false,
        hasMedicalInconsistency: item.hasMedicalInconsistency || false,
        hasCostConcern: item.hasCostConcern || false,
        alternativeSuggestions: item.alternativeSuggestions,
        dosageRecommendations: item.dosageRecommendations
      });
    });

    await this.itemAnalysisRepository.save(itemEntities);
  }

  private async saveRiskFactors(analysisId: string, riskFactors: AIAnalysisResult['riskFactors']): Promise<void> {
    const riskEntities = riskFactors.map(risk => 
      this.riskFactorRepository.create({
        analysisId,
        riskType: risk.type,
        riskLevel: risk.level,
        description: risk.description,
        affectedItems: risk.affectedItems,
        clinicalSignificance: risk.clinicalSignificance,
        requiresSpecialistReview: risk.requiresSpecialistReview || false
      })
    );

    await this.riskFactorRepository.save(riskEntities);
  }

  private async saveRecommendations(analysisId: string, recommendations: AIAnalysisResult['recommendations']): Promise<void> {
    const recommendationEntities = recommendations.map(rec => 
      this.recommendationRepository.create({
        analysisId,
        recommendationType: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        suggestedAction: rec.suggestedAction,
        targetItemIds: rec.targetItemIds,
        status: 'pending'
      })
    );

    await this.recommendationRepository.save(recommendationEntities);
  }

  /**
   * Actualiza un análisis de item específico
   */
  async updateItemAnalysis(
    itemAnalysisId: string,
    updates: {
      itemDecision?: ItemDecision;
      aiReasoning?: string;
      rejectionReasoning?: string;
      hasMedicalInconsistency?: boolean;
    }
  ): Promise<void> {
    await this.itemAnalysisRepository.update(
      { itemAnalysisId },
      updates
    );
  }
} 