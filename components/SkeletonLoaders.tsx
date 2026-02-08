/**
 * Skeleton Loaders for AI Prediction Components
 * Animated pulse effect matching component layouts
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Base Skeleton Box with pulse animation
 */
const SkeletonBox = ({ width, height, borderRadius = 8, style }: any) => {
  const { theme, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#ffffff15' : '#00000010',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * AI Badge Skeleton
 */
export const AIBadgeSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.badgeSkeleton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <SkeletonBox width={36} height={36} borderRadius={12} />
      <View style={styles.badgeTextContainer}>
        <SkeletonBox width={80} height={14} borderRadius={7} />
        <SkeletonBox width={100} height={11} borderRadius={5} style={{ marginTop: 4 }} />
      </View>
      <SkeletonBox width={24} height={24} borderRadius={12} />
      <SkeletonBox width={20} height={20} borderRadius={10} />
    </View>
  );
};

/**
 * Prediction Card Skeleton
 */
export const PredictionCardSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.predictionCardSkeleton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.predictionHeader}>
        <SkeletonBox width={36} height={36} borderRadius={12} />
        <View style={{ flex: 1 }}>
          <SkeletonBox width={120} height={16} borderRadius={8} />
          <SkeletonBox width={180} height={12} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={20} height={20} borderRadius={10} />
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.metricItem}>
            <SkeletonBox width={60} height={10} borderRadius={5} />
            <SkeletonBox width={40} height={24} borderRadius={8} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Risk Meter */}
      <View style={styles.riskMeterContainer}>
        <SkeletonBox width={80} height={12} borderRadius={6} />
        <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsContainer}>
        <SkeletonBox width={120} height={14} borderRadius={7} />
        {[1, 2].map((i) => (
          <View key={i} style={styles.recommendationItem}>
            <SkeletonBox width={4} height={40} borderRadius={2} />
            <View style={{ flex: 1 }}>
              <SkeletonBox width="80%" height={12} borderRadius={6} />
              <SkeletonBox width="100%" height={10} borderRadius={5} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Compact Prediction Skeleton (for lists)
 */
export const CompactPredictionSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.compactSkeleton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <SkeletonBox width={4} height={50} borderRadius={2} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="70%" height={14} borderRadius={7} />
        <SkeletonBox width="90%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
        <View style={styles.compactMeta}>
          <SkeletonBox width={60} height={10} borderRadius={5} />
          <SkeletonBox width={50} height={10} borderRadius={5} />
        </View>
      </View>
      <SkeletonBox width={20} height={20} borderRadius={10} />
    </View>
  );
};

/**
 * Risk Indicator Skeleton (for product cards)
 */
export const RiskIndicatorSkeleton = () => {
  return (
    <View style={styles.riskIndicatorContainer}>
      <SkeletonBox width={8} height={8} borderRadius={4} />
    </View>
  );
};

/**
 * Category Insights Skeleton
 */
export const CategoryInsightsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.categoryInsightsSkeleton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.categoryHeader}>
        <SkeletonBox width={150} height={18} borderRadius={9} />
        <SkeletonBox width={80} height={14} borderRadius={7} />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.summaryItem}>
            <SkeletonBox width={50} height={20} borderRadius={10} />
            <SkeletonBox width={70} height={10} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Performers List */}
      <View style={styles.performersList}>
        <SkeletonBox width={120} height={14} borderRadius={7} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.performerItem}>
            <SkeletonBox width="60%" height={12} borderRadius={6} />
            <SkeletonBox width={40} height={10} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // AI Badge Skeleton
  badgeSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 20,
  },
  badgeTextContainer: {
    flex: 1,
  },

  // Prediction Card Skeleton
  predictionCardSkeleton: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  riskMeterContainer: {
    paddingVertical: 8,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  // Compact Skeleton
  compactSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  compactMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },

  // Risk Indicator Skeleton
  riskIndicatorContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Category Insights Skeleton
  categoryInsightsSkeleton: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  performersList: {
    gap: 12,
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
