import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { RUN_DISCLAIMER, RUN_DISCLAIMER_TITLE, RUN_HOW_SECTIONS, RUN_HOW_TITLE } from '@/constants/runCopy';

// Run → How this works: what the call is made of, in plain words, and the medical note.
export default function RunHowItWorksScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={RUN_HOW_TITLE} />
      <ScrollView contentContainerStyle={SCREEN_STYLES.content}>
        {RUN_HOW_SECTIONS.map((s) => (
          <View key={s.title}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.title}>{RUN_DISCLAIMER_TITLE}</Text>
        <Text style={styles.body}>{RUN_DISCLAIMER}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: SPACE.xl,
    ...TYPE.titleSemibold,
  },
  body: {
    marginTop: SPACE.sm,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.relaxed,
    color: COLORS.textSecondary,
  },
});
