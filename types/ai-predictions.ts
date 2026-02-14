/**
 * TypeScript interfaces for AI Prediction System
 */

export interface Recommendation {
  action: 'urgent_markdown' | 'moderate_markdown' | 'reduce_order' | 'restock_soon' | 'overstocked' | 'monitor_closely';
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  icon: string;
}

export interface PredictionMetrics {
  velocity: number;              // Units per day
  movingAverage: number;         // 7-day moving average
  trend: 'increasing' | 'stable' | 'decreasing';
  riskScore: number;             // 0-100
  daysUntilStockout: number;
  salesLast30Days: number;
}

export interface PredictionForecast {
  next7Days: number;
  next14Days: number;
  next30Days: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface Prediction {
  _id: string;
  productId: string;
  forecast: PredictionForecast;
  metrics: PredictionMetrics;
  recommendations: Recommendation[];
  calculatedAt: string;
  dataPoints: number;
  warning?: string | null;
  metadata?: {
    usedCategoryFallback?: boolean;
    originalDataPoints?: number;
  };
}

export interface QuickInsightItem {
  productId: string;
  productName: string;
  riskScore: number;
  daysUntilStockout: number;
  recommendation: string;
}

export interface QuickInsights {
  urgentCount: number;
  criticalItems: QuickInsightItem[];
  lastUpdate: string;
}

export interface NotificationActionable {
  action: 'apply_discount' | 'restock' | 'review' | 'view_product';
  params: {
    recommendedDiscount?: number;
    daysUntilExpiry?: number;
    daysUntilStockout?: number;
    recommendedQuantity?: number;
  };
}

export interface NotificationMetadata {
  riskScore?: number;
  daysUntilStockout?: number;
  recommendedDiscount?: number;
  velocity?: number;
}

export interface Notification {
  _id: string;
  type: 'critical_risk' | 'stockout_warning' | 'bulk_alert' | 'restock_reminder';
  productId?: string;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionable?: NotificationActionable;
  read: boolean;
  dismissed: boolean;
  userId: string;
  metadata?: NotificationMetadata;
  createdAt: string;
}

export interface CategoryInsightsSummary {
  totalProducts: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  avgVelocity: number;
  avgRiskScore: number;
}

export interface CategoryPerformer {
  productId: string;
  productName: string;
  velocity: number;
  riskScore: number;
}

export interface CategoryInsights {
  category: string;
  summary: CategoryInsightsSummary;
  topPerformers: CategoryPerformer[];
  bottomPerformers: CategoryPerformer[];
}

// WebSocket event payloads
export interface PredictionUpdatePayload {
  productId: string;
  prediction: {
    forecast: PredictionForecast;
    metrics: PredictionMetrics;
    recommendations: Recommendation[];
    warning?: string | null;
  };
  timestamp: number;
}

export interface DashboardUpdatePayload {
  insights: QuickInsights;
  timestamp: number;
}

export interface CategoryUpdatePayload {
  category: string;
  insights: CategoryInsights;
  timestamp: number;
}

export interface NotificationPayload {
  notification: Notification;
  timestamp: number;
}

export interface UrgentAlertPayload {
  title: string;
  message: string;
  productId?: string;
  priority: 'critical' | 'high';
  timestamp: number;
}
