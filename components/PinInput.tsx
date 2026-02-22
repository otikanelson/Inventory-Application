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
      const completedPin = pin.join('');
      console.log('PinInput - PIN complete:', completedPin);
      onComplete(completedPin);
    }
  }, [pin, disabled]);

  const handleChangeText = (text: string) => {
    if (disabled) return;

    const digits = text.replace(/\D/g, '').split('').slice(0, length);
    const newPin = [...Array(length).fill('')];
    digits.forEach((digit, index) => {
      newPin[index] = digit;
    });
    
    setPin(newPin);
    setFocusedIndex(Math.min(digits.length, length - 1));
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
        onChangeText={handleChangeText}
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
