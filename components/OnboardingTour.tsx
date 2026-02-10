import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetPosition: { x: number; y: number; width: number; height: number };
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  icon?: keyof typeof Ionicons.glyphMap;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  visible: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  onComplete,
  visible,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(visible);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spotlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      startAnimations();
    }
  }, [visible]);

  const startAnimations = () => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Spotlight expand
    Animated.timing(spotlightAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Reset spotlight animation
      spotlightAnim.setValue(0);
      Animated.timing(spotlightAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      spotlightAnim.setValue(0);
      Animated.timing(spotlightAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onComplete();
    });
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const { targetPosition, tooltipPosition } = step;

  // Calculate spotlight position
  const spotlightSize = Math.max(targetPosition.width, targetPosition.height) + 40;
  const spotlightX = targetPosition.x + targetPosition.width / 2 - spotlightSize / 2;
  const spotlightY = targetPosition.y + targetPosition.height / 2 - spotlightSize / 2;

  // Calculate tooltip position
  let tooltipStyle: any = {};
  const tooltipMargin = 20;

  switch (tooltipPosition) {
    case 'top':
      tooltipStyle = {
        bottom: SCREEN_HEIGHT - targetPosition.y + tooltipMargin,
        left: 20,
        right: 20,
      };
      break;
    case 'bottom':
      tooltipStyle = {
        top: targetPosition.y + targetPosition.height + tooltipMargin,
        left: 20,
        right: 20,
      };
      break;
    case 'left':
      tooltipStyle = {
        right: SCREEN_WIDTH - targetPosition.x + tooltipMargin,
        top: targetPosition.y,
        maxWidth: SCREEN_WIDTH * 0.6,
      };
      break;
    case 'right':
      tooltipStyle = {
        left: targetPosition.x + targetPosition.width + tooltipMargin,
        top: targetPosition.y,
        maxWidth: SCREEN_WIDTH * 0.6,
      };
      break;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Dark overlay */}
        <View style={styles.darkOverlay} />

        {/* Spotlight circle with pulse */}
        <Animated.View
          style={[
            styles.spotlight,
            {
              left: spotlightX,
              top: spotlightY,
              width: spotlightSize,
              height: spotlightSize,
              borderRadius: spotlightSize / 2,
              transform: [
                { scale: spotlightAnim },
              ],
            },
          ]}
        />

        {/* Yellow pulsing dot */}
        <Animated.View
          style={[
            styles.pulsingDot,
            {
              left: targetPosition.x + targetPosition.width / 2 - 8,
              top: targetPosition.y + targetPosition.height / 2 - 8,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.dotInner} />
        </Animated.View>

        {/* Tooltip */}
        <Animated.View
          style={[
            styles.tooltip,
            tooltipStyle,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Icon */}
          {step.icon && (
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name={step.icon} size={24} color={theme.primary} />
            </View>
          )}

          {/* Content */}
          <Text style={[styles.tooltipTitle, { color: theme.text }]}>
            {step.title}
          </Text>
          <Text style={[styles.tooltipDescription, { color: theme.subtext }]}>
            {step.description}
          </Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index === currentStep ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Navigation buttons */}
          <View style={styles.buttonContainer}>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: theme.subtext }]}>
                Skip Tour
              </Text>
            </Pressable>

            <View style={styles.navButtons}>
              {currentStep > 0 && (
                <Pressable
                  onPress={handlePrevious}
                  style={[
                    styles.navButton,
                    { backgroundColor: theme.border },
                  ]}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.text} />
                </Pressable>
              )}

              <Pressable
                onPress={handleNext}
                style={[
                  styles.navButton,
                  styles.nextButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                {currentStep === steps.length - 1 ? (
                  <Text style={styles.doneText}>Done</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#FFF" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Step counter */}
          <Text style={[styles.stepCounter, { color: theme.subtext }]}>
            {currentStep + 1} of {steps.length}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  pulsingDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  tooltip: {
    position: 'absolute',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    paddingHorizontal: 20,
    width: 'auto',
    minWidth: 44,
  },
  doneText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepCounter: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
