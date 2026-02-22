import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

export const toastConfig = (isDark: boolean) => {
  const theme = isDark ? Colors.dark : Colors.light;
  
  return {
    success: (props: any) => (
      <View style={[styles.container, { backgroundColor: theme.surface, borderLeftColor: '#10B981' }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#10B98115' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, { color: theme.subtext }]} numberOfLines={2}>
              {props.text2}
            </Text>
          )}
        </View>
      </View>
    ),
    
    error: (props: any) => (
      <View style={[styles.container, { backgroundColor: theme.surface, borderLeftColor: '#EF4444' }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#EF444415' }]}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, { color: theme.subtext }]} numberOfLines={2}>
              {props.text2}
            </Text>
          )}
        </View>
      </View>
    ),
    
    info: (props: any) => (
      <View style={[styles.container, { backgroundColor: theme.surface, borderLeftColor: theme.primary }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, { color: theme.subtext }]} numberOfLines={2}>
              {props.text2}
            </Text>
          )}
        </View>
      </View>
    ),
    
    warning: (props: any) => (
      <View style={[styles.container, { backgroundColor: theme.surface, borderLeftColor: '#F59E0B' }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#F59E0B15' }]}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, { color: theme.subtext }]} numberOfLines={2}>
              {props.text2}
            </Text>
          )}
        </View>
      </View>
    ),
  };
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginHorizontal: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
