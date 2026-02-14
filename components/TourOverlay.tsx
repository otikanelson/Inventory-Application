import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { tourSteps, useTour } from '../context/TourContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_WIDTH = 250;
const BUBBLE_PADDING = 16;

export const TourOverlay: React.FC = () => {
  const { theme } = useTheme();
  const { isTourActive, currentStep, nextStep, previousStep, skipTour } = useTour();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTourActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTourActive]);

  if (!isTourActive || currentStep >= tourSteps.length) return null;

  const step = tourSteps[currentStep];
  const highlight = step.highlight || { x: 0, y: 0, width: 0, height: 0 };

  // Calculate the center point of the highlighted area
  const targetCenterX = highlight.x + (highlight.width / 2);
  const targetCenterY = highlight.y + (highlight.height / 2);

  // Bubble dimensions
  const BUBBLE_HEIGHT = 160; // Approximate height
  const ARROW_SIZE = 18;

  // Determine bubble position based on available space
  let bubbleTop = 0;
  let bubbleLeft = 0;
  let arrowDirection: 'up' | 'down' = 'up';
  let arrowLeft = 0;

  // Always try to position below first, then above if not enough space
  const spaceBelow = SCREEN_HEIGHT - (highlight.y + highlight.height);
  const spaceAbove = highlight.y;

  if (spaceBelow >= BUBBLE_HEIGHT + 40) {
    // Position below target - arrow points UP
    arrowDirection = 'up';
    bubbleTop = highlight.y + highlight.height + 25;
    
    // Center bubble horizontally on target, but keep it on screen
    const idealLeft = targetCenterX - (BUBBLE_WIDTH / 2);
    bubbleLeft = Math.max(BUBBLE_PADDING, Math.min(idealLeft, SCREEN_WIDTH - BUBBLE_WIDTH - BUBBLE_PADDING));
    
    // Arrow points to center of target
    arrowLeft = targetCenterX - bubbleLeft - ARROW_SIZE;
    
    // Clamp arrow position to stay within bubble bounds
    arrowLeft = Math.max(20, Math.min(arrowLeft, BUBBLE_WIDTH - 40));
  } else {
    // Position above target - arrow points DOWN
    arrowDirection = 'down';
    bubbleTop = highlight.y - BUBBLE_HEIGHT - 25;
    
    // Ensure bubble doesn't go above screen
    bubbleTop = Math.max(80, bubbleTop);
    
    // Center bubble horizontally on target, but keep it on screen
    const idealLeft = targetCenterX - (BUBBLE_WIDTH / 2);
    bubbleLeft = Math.max(BUBBLE_PADDING, Math.min(idealLeft, SCREEN_WIDTH - BUBBLE_WIDTH - BUBBLE_PADDING));
    
    // Arrow points to center of target
    arrowLeft = targetCenterX - bubbleLeft - ARROW_SIZE;
    
    // Clamp arrow position to stay within bubble bounds
    arrowLeft = Math.max(20, Math.min(arrowLeft, BUBBLE_WIDTH - 40));
  }

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          pointerEvents: isTourActive ? 'auto' : 'none',
        },
      ]}
    >
      {/* Speech Bubble - dynamically positioned */}
      <View
        style={[
          styles.speechBubble,
          {
            top: bubbleTop,
            left: bubbleLeft,
            width: BUBBLE_WIDTH,
            backgroundColor: theme.surface,
            borderColor: '#FFD700',
          },
        ]}
      >
        {/* Arrow pointing to target */}
        {arrowDirection === 'up' && (
          <>
            <View
              style={[
                styles.arrowUp,
                {
                  left: arrowLeft,
                  borderBottomColor: theme.surface,
                },
              ]}
            />
            <View
              style={[
                styles.arrowUpBorder,
                {
                  left: arrowLeft,
                  borderBottomColor: '#FFD700',
                },
              ]}
            />
          </>
        )}
        {arrowDirection === 'down' && (
          <>
            <View
              style={[
                styles.arrowDown,
                {
                  left: arrowLeft,
                  borderTopColor: theme.surface,
                },
              ]}
            />
            <View
              style={[
                styles.arrowDownBorder,
                {
                  left: arrowLeft,
                  borderTopColor: '#FFD700',
                },
              ]}
            />
          </>
        )}

        {/* AI Icon at top-left corner */}
        <Animated.View
          style={[
            styles.aiIcon,
            {
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color="#FFD700" />
        </Animated.View>

        <View style={styles.bubbleContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {step.title}
            </Text>
            <Text style={[styles.counter, { color: '#FFD700' }]}>
              {currentStep + 1}/{tourSteps.length}
            </Text>
          </View>
          
          <Text style={[styles.description, { color: theme.subtext }]} numberOfLines={3}>
            {step.description}
          </Text>

          <View style={styles.controls}>
            <Pressable onPress={skipTour}>
              <Text style={[styles.skipText, { color: theme.subtext }]}>Skip</Text>
            </Pressable>

            <View style={styles.navButtons}>
              {currentStep > 0 && (
                <Pressable
                  onPress={previousStep}
                  style={[styles.navBtn, { backgroundColor: theme.border }]}
                >
                  <Ionicons name="chevron-back" size={14} color={theme.text} />
                </Pressable>
              )}

              <Pressable
                onPress={nextStep}
                style={[styles.nextBtn, { backgroundColor: '#FFD700' }]}
              >
                {currentStep === tourSteps.length - 1 ? (
                  <Text style={styles.btnText}>Done</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={14} color="#000" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  speechBubble: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  // Arrow pointing up
  arrowUp: {
    position: 'absolute',
    top: -16,
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
  },
  arrowUpBorder: {
    position: 'absolute',
    top: -20,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 0,
  },
  // Arrow pointing down
  arrowDown: {
    position: 'absolute',
    bottom: -16,
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
  },
  arrowDownBorder: {
    position: 'absolute',
    bottom: -20,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 0,
  },
  aiIcon: {
    position: 'absolute',
    top: -16,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 2,
  },
  bubbleContent: {
    padding: 12,
    paddingTop: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  counter: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 28,
  },
  btnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
});
