import { Stack } from 'expo-router';

export default function AuthorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="store/[id]" />
    </Stack>
  );
}
