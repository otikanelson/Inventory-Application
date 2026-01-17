import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Class component (Error Boundaries must be class components in React)
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service in production
    console.error('Error Boundary Caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <ErrorFallback error={this.state.error} onReset={this.resetError} />;
    }

    return this.props.children;
  }
}

// Functional component for the error UI (uses hooks)
const ErrorFallback: React.FC<{ error: Error | null; onReset: () => void }> = ({ 
  error, 
  onReset 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.notification + '20' }]}>
        <Ionicons name="warning-outline" size={64} color={theme.notification} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        Something Went Wrong
      </Text>

      <Text style={[styles.message, { color: theme.subtext }]}>
        {error?.message || 'An unexpected error occurred'}
      </Text>

      {__DEV__ && (
        <View style={[styles.debugBox, { backgroundColor: theme.surface }]}>
          <Text style={[styles.debugTitle, { color: theme.primary }]}>
            Debug Info:
          </Text>
          <Text style={[styles.debugText, { color: theme.text }]}>
            {error?.stack || 'No stack trace available'}
          </Text>
        </View>
      )}

      <Pressable 
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={onReset}
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  debugBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

// Export wrapper function to use the error boundary
export const ErrorBoundary = ErrorBoundaryClass;

// HOC to wrap any component with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <ErrorBoundaryClass fallback={fallback}>
      <Component {...props} />
    </ErrorBoundaryClass>
  );
}