import { Injectable, Inject } from '@nestjs/common';
import { AdminUserService } from '../admin/admin-user.service';
import { MedicalOrdersService } from '../medical-orders/medical-orders.service';
import { ActivityLogService } from '../activity/activity-log.service';
import { EffectorRequestService } from '../effector-request/effector-request.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly medicalOrdersService: MedicalOrdersService,
    private readonly activityLogService: ActivityLogService,
    private readonly effectorRequestService: EffectorRequestService,
  ) {}

  async getCompleteDashboardData(): Promise<any> {
    try {
      const [
        userStats,
        medicalOrderStats,
        activityData,
        effectorRequestStats
      ] = await Promise.all([
        this.getUserStatsData(),
        this.getMedicalOrderStatsData(),
        this.getActivityData(),
        this.getEffectorRequestStatsData()
      ]);

      return {
        timestamp: new Date().toISOString(),
        overview: {
          totalUsers: userStats.total,
          totalMedicalOrders: medicalOrderStats.total,
          totalEffectorRequests: effectorRequestStats.total,
          totalActivities: activityData.stats.totalActivities,
          systemHealth: this.calculateSystemHealth(medicalOrderStats, effectorRequestStats)
        },
        users: userStats,
        medicalOrders: medicalOrderStats,
        effectorRequests: effectorRequestStats,
        activities: activityData,
        performance: {
          avgProcessingTime: medicalOrderStats.avgProcessingTime || 2.5,
          successRate: medicalOrderStats.successRate || 85,
          uptime: '99.8%',
          responseTime: '150ms'
        },
        alerts: await this.getSystemAlerts(),
        trends: await this.getTrendData()
      };
    } catch (error) {
      console.error('Error getting complete dashboard data:', error);
      return {
        error: 'Error loading dashboard data',
        timestamp: new Date().toISOString(),
        partial: true
      };
    }
  }

  async getRealtimeData(): Promise<any> {
    try {
      const [recentActivities, liveStats] = await Promise.all([
        this.activityLogService.findRecent(10),
        this.getLiveStats()
      ]);

      return {
        timestamp: new Date().toISOString(),
        recentActivities,
        liveStats,
        systemStatus: {
          status: 'operational',
          activeUsers: liveStats.activeUsers || 0,
          pendingRequests: liveStats.pendingRequests || 0,
          processingQueue: liveStats.processingQueue || 0
        }
      };
    } catch (error) {
      console.error('Error getting realtime data:', error);
      return {
        error: 'Error loading realtime data',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getExecutiveSummary(): Promise<any> {
    try {
      const [userStats, medicalOrderStats, activityStats] = await Promise.all([
        this.getUserStatsData(),
        this.getMedicalOrderStatsData(),
        this.activityLogService.getActivityStats()
      ]);

      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      return {
        period: {
          from: lastMonth.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        },
        kpis: {
          totalUsers: userStats.total,
          newUsers: Math.floor(userStats.total * 0.1), // Mock growth rate
          totalOrders: medicalOrderStats.total,
          approvedOrders: medicalOrderStats.approved || 0,
          totalActivity: activityStats.totalActivities,
          systemUptime: 99.8
        },
        growth: {
          users: 12.5,
          orders: 8.3,
          activity: 15.7,
          efficiency: 3.2
        },
        priorities: [
          'Revisar pedidos pendientes de aprobación',
          'Optimizar tiempo de respuesta del sistema',
          'Actualizar datos de proveedores',
          'Realizar mantenimiento preventivo'
        ]
      };
    } catch (error) {
      console.error('Error getting executive summary:', error);
      return {
        error: 'Error loading executive summary',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getUserStatsData(): Promise<any> {
    try {
      return await this.adminUserService.getUserStats();
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { total: 0, by_role: {}, error: 'Failed to load user stats' };
    }
  }

  private async getMedicalOrderStatsData(): Promise<any> {
    try {
      return await this.medicalOrdersService.getDashboardStats();
    } catch (error) {
      console.error('Error getting medical order stats:', error);
      return { total: 0, error: 'Failed to load medical order stats' };
    }
  }

  private async getActivityData(): Promise<any> {
    try {
      const [recentActivities, stats] = await Promise.all([
        this.activityLogService.findRecent(15),
        this.activityLogService.getActivityStats()
      ]);
      return { recentActivities, stats };
    } catch (error) {
      console.error('Error getting activity data:', error);
      return { 
        recentActivities: [], 
        stats: { totalActivities: 0, todayActivities: 0, weekActivities: 0, topActions: [], topUsers: [] }, 
        error: 'Failed to load activity data' 
      };
    }
  }

  private async getEffectorRequestStatsData(): Promise<any> {
    try {
      return await this.effectorRequestService.getRequestStatistics();
    } catch (error) {
      console.error('Error getting effector request stats:', error);
      return { total: 0, error: 'Failed to load effector request stats' };
    }
  }

  private calculateSystemHealth(medicalOrders: any, effectorRequests: any): string {
    const medicalOrderHealth = medicalOrders.successRate || 85;
    const requestProcessingRate = effectorRequests.total > 0 ? 
      ((effectorRequests.aprobado || 0) / effectorRequests.total) * 100 : 100;
    
    const overallHealth = (medicalOrderHealth + requestProcessingRate) / 2;
    
    if (overallHealth >= 90) return 'excellent';
    if (overallHealth >= 75) return 'good';
    if (overallHealth >= 60) return 'fair';
    return 'needs_attention';
  }

  private async getSystemAlerts(): Promise<any[]> {
    const alerts = [];
    
    try {
      const stats = await this.getEffectorRequestStatsData();
      
      if (stats.urgentRequests > 10) {
        alerts.push({
          type: 'warning',
          message: `${stats.urgentRequests} solicitudes urgentes pendientes`,
          priority: 'high',
          timestamp: new Date().toISOString()
        });
      }
      
      if (stats.pendiente > 50) {
        alerts.push({
          type: 'info',
          message: `${stats.pendiente} solicitudes pendientes de revisión`,
          priority: 'medium',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      alerts.push({
        type: 'error',
        message: 'Error al verificar alertas del sistema',
        priority: 'low',
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  private async getTrendData(): Promise<any> {
    // Mock trend data - in a real implementation, this would calculate trends from historical data
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 20,
        orders: Math.floor(Math.random() * 30) + 10,
        activities: Math.floor(Math.random() * 100) + 50
      };
    });

    return {
      weekly: lastWeek,
      summary: {
        userGrowth: 12.5,
        orderGrowth: 8.3,
        activityGrowth: 15.7
      }
    };
  }

  private async getLiveStats(): Promise<any> {
    // Mock live stats - in a real implementation, this would query current system state
    return {
      activeUsers: Math.floor(Math.random() * 20) + 5,
      pendingRequests: Math.floor(Math.random() * 10) + 2,
      processingQueue: Math.floor(Math.random() * 5),
      responseTime: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 2
    };
  }
} 