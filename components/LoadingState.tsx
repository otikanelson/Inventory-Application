import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  fullScreen = false,
  size = 'large'
}) => {
  const { theme } = useTheme();

  const containerStyle = fullScreen ? styles.fullScreen : styles.inline;

  return (
    <View style={[containerStyle, { backgroundColor: fullScreen ? theme.background : 'transparent' }]}>
      <ActivityIndicator 
        size={size} 
        color={theme.primary} 
        style={styles.spinner}
      />
      {message && (
        <Text style={[styles.message, { color: theme.subtext }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
  skeleton: {
    height: 120,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
});

// Skeleton loader for lists
export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View 
          key={index}
          style={[
            styles.skeleton, 
            { 
              backgroundColor: isDark ? '#ffffff10' : '#00000005',
              borderColor: theme.border 
            }
          ]}
        />
      ))}
    </>
  );
};