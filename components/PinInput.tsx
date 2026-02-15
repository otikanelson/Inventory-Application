import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  onClear?: () => void;
  error?: boolean;
  disabled?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  onComplete,
  onClear,
  error = false,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    // Check if PIN is complete
    if (pin.every((digit) => digit !== '') && !disabled) {
      onComplete(pin.join(''));
    }
  }, [pin, disabled]);

  const handleKeyPress = (key: string) => {
    if (disabled) return;

    if (key === 'backspace') {
      const newPin = [...pin];
      if (focusedIndex > 0 || pin[focusedIndex] !== '') {
        const indexToClear = pin[focusedIndex] !== '' ? focusedIndex : focusedIndex - 1;
        newPin[indexToClear] = '';
        setPin(newPin);
        setFocusedIndex(Math.max(0, indexToClear));
      }
    } else if (/^\d$/.test(key) && focusedIndex < length) {
      const newPin = [...pin];
      newPin[focusedIndex] = key;
      setPin(newPin);
      setFocusedIndex(Math.min(length - 1, focusedIndex + 1));
    }
  };

  const handleClear = () => {
    setPin(Array(length).fill(''));
    setFocusedIndex(0);
    inputRef.current?.focus();
    onClear?.();
  };

  return (
    <View style={styles.container}>
      {/* Hidden input for keyboard */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        keyboardType="number-pad"
        maxLength={length}
        value={pin.join('')}
        onKeyPress={(e) => handleKeyPress(e.nativeEvent.key)}
        editable={!disabled}
        autoFocus
      />

      {/* PIN dots display */}
      <View style={styles.pinContainer}>
        {pin.map((digit, index) => (
          <Pressable
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor: theme.surface,
                borderColor: error
                  ? theme.notification
                  : focusedIndex === index
                  ? theme.primary
                  : theme.border,
                borderWidth: focusedIndex === index ? 2 : 1,
              },
            ]}
            onPress={() => {
              setFocusedIndex(index);
              inputRef.current?.focus();
            }}
          >
            {digit !== '' && (
              <View
                style={[
                  styles.filledDot,
                  {
                    backgroundColor: error ? theme.notification : theme.primary,
                  },
                ]}
              />
            )}
          </Pressable>
        ))}
      </View>

      {/* Clear button */}
      {pin.some((digit) => digit !== '') && (
        <Pressable style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="backspace-outline" size={24} color={theme.subtext} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  pinDot: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  clearButton: {
    padding: 8,
  },
});
