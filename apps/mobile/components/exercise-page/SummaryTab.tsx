import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressChart } from '@/components/charts/ProgressChart';
import { Medal } from '@/components/workout/PrToast';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricPills } from '@/components/ui/MetricPills';
import { ChartHeader, SESSION_SUMMARY_STYLES } from '@/components/charts/ChartHeader';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { CHART_DEFAULTS } from '@/constants/defaults';
import { LAYOUT, SPACE } from '@/constants/layout';
import { EXERCISE_PAGE_SIZES, ICON_SIZES } from '@/constants/sizes';
import { PERIODS } from '@/constants/periods';
import { METRICS, chartPoints, formatTick, formatValue, gymChartMarks, personalRecords } from '@/lib/stats/exerciseMetrics';
import { GYM_LABELS } from '@/constants/labels';
import { inPeriod, periodIndex } from '@/lib/training/periods';
import { monthDay, shortDate } from '@/lib/format/date';
import { ExerciseClip } from './ExerciseClip';
import { shared } from './styles';
import type { ExerciseTabProps } from './types';

// The clip, the muscles, a progress chart with its metric pills, then the
// personal records.
export function SummaryTab({ detail }: ExerciseTabProps) {
  const metrics = METRICS[detail.type];
  const [metric, setMetric] = useState(0);
  const [range, setRange] = useState(() => periodIndex(CHART_DEFAULTS.exercisePeriod));
  const [selected, setSelected] = useState<number | null>(null);
  // A new range starts with no bar picked.
  const pickRange = useCallback((i: number) => {
    setRange(i);
    setSelected(null);
  }, []);
  const pickMetric = useCallback((i: number) => {
    setMetric(i);
    setSelected(null);
  }, []);

  // Memoized: a tap on the chart only moves the selection.
  const m = metrics[metric];
  const points = useMemo(() => chartPoints(inPeriod(detail.sessions, PERIODS[range].days), m), [detail, range, m]);
  const chart = useMemo(
    () => points.map((p) => ({ label: monthDay(new Date(p.session.startTime)), value: p.value })),
    [points]
  );
  const tick = useCallback((v: number) => formatTick(v, m.unit), [m]);
  const shown = selected !== null && selected < points.length ? selected : points.length - 1;
  // A machine's chart fades the other gyms' sessions and breaks at each change.
  const marks = useMemo(
    () => (detail.gym ? gymChartMarks(points.map((p) => p.session.gymKey), detail.gym.key) : null),
    [detail, points]
  );
  const records = useMemo(() => personalRecords(detail.type, detail.sessions, detail.gym?.key), [detail]);
  const metricOptions = useMemo(() => metrics.map((x, i) => ({ key: i, label: x.label })), [metrics]);

  return (
    <>
      <ExerciseClip catalogueId={detail.catalogueId} />
      <View style={shared.body}>
        <Text style={shared.name}>{detail.name}</Text>
        <Text style={styles.muscles}>Primary: {detail.primary}</Text>
        {detail.secondary.length > 0 && <Text style={styles.muscles}>Secondary: {detail.secondary.join(', ')}</Text>}

        <ChartHeader ranges={PERIODS} range={range} onRange={pickRange}>
          {shown >= 0 ? (
            <>
              <Text style={SESSION_SUMMARY_STYLES.value}>{formatValue(points[shown].value, m.unit)} </Text>
              <Text style={SESSION_SUMMARY_STYLES.date}>{shortDate(new Date(points[shown].session.startTime))}</Text>
            </>
          ) : (
            <Text style={SESSION_SUMMARY_STYLES.empty}>No data yet</Text>
          )}
        </ChartHeader>

        <View style={styles.chart}>
          {points.length > 0 && <ProgressChart points={chart} formatTick={tick} selected={shown} onSelect={setSelected} faded={marks?.faded} breaks={marks?.breaks} />}
        </View>

        <MetricPills options={metricOptions} value={metric} onChange={pickMetric} wrap />

        <View style={styles.recordsHeader}>
          <Medal size={ICON_SIZES.xl} />
          <Text style={styles.recordsTitle}>Personal Records</Text>
        </View>
        {detail.gym && (
          <Text style={styles.recordsGym}>
            {GYM_LABELS.recordsAt} {detail.gym.name}
          </Text>
        )}
        {records.length === 0 && <EmptyState message="Log this exercise to set records." note />}
        {records.map((r) => (
          <View key={r.label} style={styles.recordRow}>
            <Text style={styles.recordLabel}>{r.label}</Text>
            <View style={styles.recordValues}>
              <Text style={styles.recordValue}>{r.value}</Text>
              {r.allGyms !== undefined && (
                <Text style={styles.recordAllGyms}>
                  {GYM_LABELS.allGyms} {r.allGyms}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  muscles: {
    marginTop: 0,
    ...TYPE.callout,
    lineHeight: LINE_HEIGHTS.relaxed,
    color: COLORS.textSecondary,
  },
  // Headline, range, chart and chips as the routine page (02d).
  chart: {
    marginTop: SPACE.xl,
    marginHorizontal: -LAYOUT.screenMargin,
    minHeight: EXERCISE_PAGE_SIZES.chartMinHeight,
  },
  // Medal + grey "Personal Records", then 55-tall rows: label white, value blue.
  recordsHeader: {
    marginTop: SPACE.xxl,
    marginBottom: SPACE.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  recordsTitle: {
    ...TYPE.row,
    color: COLORS.textSecondary,
  },
  // "At Basic-Fit Nation", in line with the title text (the medal and its gap come first).
  recordsGym: {
    marginLeft: ICON_SIZES.xl + SPACE.sm,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  recordValues: {
    alignItems: 'flex-end',
  },
  recordAllGyms: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  recordRow: {
    height: EXERCISE_PAGE_SIZES.recordRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  recordLabel: {
    ...TYPE.body,
  },
  recordValue: {
    ...TYPE.body,
    color: COLORS.primary,
  },
});
