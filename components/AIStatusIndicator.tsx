import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AIStatusIndicatorProps {
  onPress?: () => void;
  compact?: boolean;
}

export type AIStatus = 'collecting' | 'learning' | 'active' | 'insufficient';

interface AIStatusData {
  status: AIStatus;
  productCount: number;
  salesCount: number;
  daysActive: number;
  progress: number; // 0-100
  message: string;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  onPress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const [statusData, setStatusData] = useState<AIStatusData>({
    status: 'collecting',
    productCount: 0,
    salesCount: 0,
    daysActive: 0,
    progress: 0,
    message: 'Collecting data...',
  });

  useEffect(() => {
    fetchAIStatus();
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/analytics/ai-status`
      );
      
      if (response.data.success) {
        setStatusData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI status:', error);
    }
  };

  const getStatusConfig = () => {
    switch (statusData.status) {
      case 'active':
        return {
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          color: '#34C759',
          bgColor: '#34C75920',
          label: 'AI Active',
        };
      case 'learning':
        return {
          icon: 'analytics' as keyof typeof Ionicons.glyphMap,
          color: '#FF9500',
          bgColor: '#FF950020',
          label: 'Learning',
        };
      case 'collecting':
        return {
          icon: 'hourglass' as keyof typeof Ionicons.glyphMap,
          color: '#007AFF',
          bgColor: '#007AFF20',
          label: 'Collecting Data',
        };
      default:
        return {
          icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
          color: theme.subtext,
          bgColor: theme.background,
          label: 'Insufficient Data',
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.compactContainer,
          { backgroundColor: config.bgColor, borderColor: config.color },
        ]}
      >
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.compactText, { color: config.color }]}>
          {config.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.label, { color: theme.text }]}>
            AI Predictions
          </Text>
          <Text style={[styles.status, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        )}
      </View>

      {statusData.status !== 'active' && (
        <>
          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: config.color, width: `${statusData.progress}%` },
              ]}
            />
          </View>

          {/* Requirements */}
          <View style={styles.requirements}>
            <RequirementItem
              icon="cube"
              label="Products"
              current={statusData.productCount}
              required={10}
              theme={theme}
            />
            <RequirementItem
              icon="cart"
              label="Sales"
              current={statusData.salesCount}
              required={20}
              theme={theme}
            />
            {statusData.status === 'learning' && (
              <RequirementItem
                icon="time"
                label="Days"
                current={statusData.daysActive}
                required={7}
                theme={theme}
              />
            )}
          </View>

          {/* Message */}
          <Text style={[styles.message, { color: theme.subtext }]}>
            {statusData.message}
          </Text>
        </>
      )}

      {statusData.status === 'active' && (
        <Text style={[styles.activeMessage, { color: theme.subtext }]}>
          AI is analyzing your inventory and providing predictions
        </Text>
      )}
    </Pressable>
  );
};

interface RequirementItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  current: number;
  required: number;
  theme: any;
}

const RequirementItem: React.FC<RequirementItemProps> = ({
  icon,
  label,
  current,
  required,
  theme,
}) => {
  const isComplete = current >= required;
  const color = isComplete ? '#34C759' : theme.subtext;

  return (
    <View style={styles.requirementItem}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.requirementText, { color }]}>
        {label}: {current}/{required}
      </Text>
      {isComplete && (
        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  activeMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
