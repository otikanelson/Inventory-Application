/**
 * Prediction Card Component
 * Shows AI predictions, forecast, risk score, and recommendations for a product
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Prediction } from '../types/ai-predictions';
import { PredictionCardSkeleton } from './SkeletonLoaders';

interface PredictionCardProps {
  prediction: Prediction | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const PredictionCard = ({ prediction, loading, onRefresh }: PredictionCardProps) => {
  const { theme, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Toggle expansion
  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
    setIsExpanded(!isExpanded);
  };

  // Get risk color
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return '#FF3B30';
    if (riskScore >= 50) return '#FF9500';
    if (riskScore >= 30) return '#FFCC00';
    return '#34C759';
  };

  // Get confidence color
  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return '#34C759';
    if (confidence === 'medium') return '#FF9500';
    return '#FFCC00';
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return 'trending-up';
    if (trend === 'decreasing') return 'trending-down';
    return 'remove';
  };

  if (loading) {
    return <PredictionCardSkeleton />;
  }

  if (!prediction) {
    return null;
  }

  const { forecast, metrics, recommendations, warning } = prediction;
  const riskColor = getRiskColor(metrics.riskScore);
  const confidenceColor = getConfidenceColor(forecast.confidence);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        onPress={toggleExpand}
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="sparkles" size={20} color={theme.primary} />
        </View>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            AI Predictions
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
            {isExpanded ? 'Tap to collapse' : 'Tap to view insights'}
          </Text>
        </View>

        {onRefresh && (
          <Pressable onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={18} color={theme.subtext} />
          </Pressable>
        )}

        <Animated.View
          style={{
            transform: [
              {
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Ionicons name="chevron-down" size={20} color={theme.subtext} />
        </Animated.View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: animation,
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000],
              }),
            },
          ]}
        >
          {/* Low Confidence Warning */}
          {warning && (
            <View style={[styles.warningBanner, { backgroundColor: '#FFCC00' + '20', borderColor: '#FFCC00' + '40' }]}>
              <Ionicons name="warning" size={16} color="#FFCC00" />
              <Text style={[styles.warningText, { color: isDark ? '#FFF' : '#000' }]}>
                {warning}
              </Text>
            </View>
          )}

          {/* Forecast Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Demand Forecast
            </Text>
            <View style={styles.forecastGrid}>
              <View style={styles.forecastItem}>
                <Text style={[styles.forecastLabel, { color: theme.subtext }]}>
                  Next 7 Days
                </Text>
                <Text style={[styles.forecastValue, { color: theme.text }]}>
                  {forecast.next7Days} units
                </Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={[styles.forecastLabel, { color: theme.subtext }]}>
                  Next 14 Days
                </Text>
                <Text style={[styles.forecastValue, { color: theme.text }]}>
                  {forecast.next14Days} units
                </Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={[styles.forecastLabel, { color: theme.subtext }]}>
                  Next 30 Days
                </Text>
                <Text style={[styles.forecastValue, { color: theme.text }]}>
                  {forecast.next30Days} units
                </Text>
              </View>
            </View>

            {/* Confidence Badge */}
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
              <Ionicons name="checkmark-circle" size={14} color={confidenceColor} />
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {forecast.confidence.toUpperCase()} CONFIDENCE
              </Text>
            </View>
          </View>

          {/* Metrics Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Key Metrics
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: riskColor + '20' }]}>
                  <Ionicons name="alert-circle" size={16} color={riskColor} />
                </View>
                <Text style={[styles.metricLabel, { color: theme.subtext }]}>
                  Risk Score
                </Text>
                <Text style={[styles.metricValue, { color: riskColor }]}>
                  {metrics.riskScore}/100
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="speedometer" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.metricLabel, { color: theme.subtext }]}>
                  Velocity
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {metrics.velocity.toFixed(1)}/day
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name={getTrendIcon(metrics.trend)} size={16} color={theme.primary} />
                </View>
                <Text style={[styles.metricLabel, { color: theme.subtext }]}>
                  Trend
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {metrics.trend}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="time" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.metricLabel, { color: theme.subtext }]}>
                  Stockout
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {metrics.daysUntilStockout < 999 ? `${metrics.daysUntilStockout}d` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Risk Meter */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Risk Assessment
            </Text>
            <View style={styles.riskMeterContainer}>
              <View style={[styles.riskMeterTrack, { backgroundColor: isDark ? '#ffffff10' : '#00000010' }]}>
                <View
                  style={[
                    styles.riskMeterFill,
                    {
                      width: `${metrics.riskScore}%`,
                      backgroundColor: riskColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.riskMeterLabel, { color: theme.subtext }]}>
                {metrics.riskScore < 30
                  ? 'Low Risk'
                  : metrics.riskScore < 50
                    ? 'Moderate Risk'
                    : metrics.riskScore < 70
                      ? 'High Risk'
                      : 'Critical Risk'}
              </Text>
            </View>
          </View>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recommendations
              </Text>
              {recommendations.map((rec, index) => {
                const priorityColor =
                  rec.priority === 'critical'
                    ? '#FF3B30'
                    : rec.priority === 'high'
                      ? '#FF9500'
                      : rec.priority === 'medium'
                        ? '#FFCC00'
                        : '#34C759';

                return (
                  <View
                    key={index}
                    style={[
                      styles.recommendationItem,
                      {
                        backgroundColor: isDark ? '#ffffff08' : '#00000005',
                        borderColor: priorityColor + '30',
                      },
                    ]}
                  >
                    <View style={[styles.recommendationIndicator, { backgroundColor: priorityColor }]} />
                    <View style={styles.recommendationContent}>
                      <View style={styles.recommendationHeader}>
                        <Ionicons name={rec.icon as any} size={14} color={priorityColor} />
                        <Text style={[styles.recommendationPriority, { color: priorityColor }]}>
                          {rec.priority.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.recommendationMessage, { color: theme.text }]}>
                        {rec.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Data Info */}
          <View style={[styles.dataInfo, { backgroundColor: isDark ? '#ffffff05' : '#00000005' }]}>
            <Ionicons name="information-circle-outline" size={14} color={theme.subtext} />
            <Text style={[styles.dataInfoText, { color: theme.subtext }]}>
              Based on {prediction.dataPoints} days of sales data • Last updated{' '}
              {new Date(prediction.calculatedAt).toLocaleTimeString()}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 20,
    overflow: 'hidden',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  forecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 6,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  riskMeterContainer: {
    gap: 8,
  },
  riskMeterTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskMeterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  recommendationIndicator: {
    width: 4,
    borderRadius: 2,
  },
  recommendationContent: {
    flex: 1,
    gap: 6,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendationPriority: {
    fontSize: 10,
    fontWeight: '800',
  },
  recommendationMessage: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  dataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  dataInfoText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
});
