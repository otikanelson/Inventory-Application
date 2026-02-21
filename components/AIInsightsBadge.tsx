/**
 * AI Insights Badge Component
 * Always-visible badge showing urgent AI predictions
 * Expandable to show top 3 recommendations
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAIPredictions } from '../hooks/useAIPredictions';

export const AIInsightsBadge = () => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const { quickInsights, loading, error, isConnected } = useAIPredictions({
    enableWebSocket: true,
    autoFetch: true,
  });

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

  // Get urgency color based on count
  const getUrgencyColor = (count: number) => {
    if (count === 0) return '#34C759'; // Green
    if (count <= 2) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const urgentCount = quickInsights?.urgentCount || 0;
  const urgencyColor = getUrgencyColor(urgentCount);

  // Navigate to product
  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
    setIsExpanded(false);
  };

  // Get risk color
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return '#FF3B30';
    if (riskScore >= 50) return '#FF9500';
    return '#FFCC00';
  };

  if (error) {
    return null; // Silently fail - don't show badge if there's an error
  }

  return (
    <View style={styles.container}>
      {/* Collapsed Badge */}
      <Pressable
        onPress={toggleExpand}
        style={[
          styles.badge,
          {
            backgroundColor: theme.surface,
            borderColor: urgencyColor + '40',
          },
        ]}
      >
        <View style={styles.badgeContent}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: urgencyColor + '20' },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={urgencyColor} />
            ) : (
              <Ionicons name="sparkles" size={16} color={urgencyColor} />
            )}
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.badgeTitle, { color: theme.text }]}>
              AI Insights
            </Text>
            <Text style={[styles.badgeSubtitle, { color: theme.subtext }]}>
              {loading
                ? 'Analyzing inventory...'
                : urgentCount === 0
                ? 'Monitoring inventory - will alert when action needed'
                : `${urgentCount} urgent ${urgentCount === 1 ? 'item' : 'items'}`}
            </Text>
          </View>

          {/* Count Badge */}
          {urgentCount > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: urgencyColor },
              ]}
            >
              <Text style={styles.countText}>{urgentCount}</Text>
            </View>
          )}

          {/* Expand Icon */}
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
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.subtext}
            />
          </Animated.View>

          {/* Connection Indicator */}
          {isConnected && (
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: '#34C759' },
              ]}
            />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.expandedContent,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: animation,
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 400],
              }),
            },
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.subtext }]}>
                Loading insights...
              </Text>
            </View>
          ) : urgentCount === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color="#34C759"
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                All Clear!
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
                No urgent items requiring attention
              </Text>
            </View>
          ) : (
            <View style={styles.itemsContainer}>
              <Text style={[styles.expandedTitle, { color: theme.text }]}>
                Top Urgent Items
              </Text>
              {quickInsights?.criticalItems.slice(0, 3).map((item, index) => (
                <Pressable
                  key={item.productId}
                  onPress={() => handleProductPress(item.productId)}
                  style={[
                    styles.insightItem,
                    {
                      backgroundColor: isDark ? '#ffffff08' : '#00000005',
                      borderColor: getRiskColor(item.riskScore) + '30',
                    },
                  ]}
                >
                  {/* Risk Indicator */}
                  <View
                    style={[
                      styles.riskIndicator,
                      { backgroundColor: getRiskColor(item.riskScore) },
                    ]}
                  />

                  {/* Content */}
                  <View style={styles.itemContent}>
                    <Text
                      style={[styles.itemName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.productName}
                    </Text>
                    <Text
                      style={[styles.itemRecommendation, { color: theme.subtext }]}
                      numberOfLines={2}
                    >
                      {item.recommendation}
                    </Text>
                    <View style={styles.itemMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="alert-circle"
                          size={12}
                          color={getRiskColor(item.riskScore)}
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: getRiskColor(item.riskScore) },
                          ]}
                        >
                          Risk: {item.riskScore}/100
                        </Text>
                      </View>
                      {item.daysUntilStockout < 999 && (
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={theme.subtext}
                          />
                          <Text style={[styles.metaText, { color: theme.subtext }]}>
                            {item.daysUntilStockout}d left
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Arrow */}
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.subtext}
                  />
                </Pressable>
              ))}

              {/* View All Button */}
              {urgentCount > 3 && (
                <Pressable
                  onPress={() => {
                    router.push('/admin/stats' as any);
                    setIsExpanded(false);
                  }}
                  style={[
                    styles.viewAllButton,
                    { backgroundColor: theme.primary + '20' },
                  ]}
                >
                  <Text style={[styles.viewAllText, { color: theme.primary }]}>
                    View All {urgentCount} Items
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.primary}
                  />
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  badge: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  badgeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  connectionDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandedContent: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemsContainer: {
    gap: 12,
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  riskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemRecommendation: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
