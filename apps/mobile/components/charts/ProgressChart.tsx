import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { scale } from '@/lib/chartScale';
import { COLORS, FONT_SIZES, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { PROGRESS_CHART_SIZES } from '@/constants/sizes';
import { CHART_FADED_OPACITY, PROGRESS_CHART_LIMITS } from '@/constants/limits';
import type { PlotProps, ProgressChartProps } from './types';

// The line chart on the routine page: one dot per workout, evenly spaced;
// the value range padded by 10% above and below; grid lines at "nice" steps.
// A machine's page fades the points of other gyms and breaks the line, with a
// dashed line, wherever the gym changes.


// Memoized; a tap only redraws the selected dot, the rest of the chart is kept.
export const ProgressChart = memo(function ProgressChart({
  points,
  formatTick,
  selected,
  onSelect,
  faded,
  breaks,
}: ProgressChartProps) {
  const [width, setWidth] = useState(0);
  const right = width - PROGRESS_CHART_SIZES.rightGap;
  const { min, max, ticks, step } = useMemo(() => scale(points.map((p) => p.value)), [points]);
  const x = (i: number) => (points.length > 1 ? PROGRESS_CHART_SIZES.left + ((right - PROGRESS_CHART_SIZES.left) * i) / (points.length - 1) : (PROGRESS_CHART_SIZES.left + right) / 2);
  const y = (v: number) => PROGRESS_CHART_SIZES.plotHeight - ((v - min) / (max - min)) * PROGRESS_CHART_SIZES.plotHeight;

  function select(e: GestureResponderEvent) {
    if (points.length === 0) return;
    const i = points.length > 1 ? Math.round(((e.nativeEvent.locationX - PROGRESS_CHART_SIZES.left) / (right - PROGRESS_CHART_SIZES.left)) * (points.length - 1)) : 0;
    onSelect(Math.max(0, Math.min(points.length - 1, i)));
  }

  return (
    <Pressable style={styles.chart} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} onPress={select}>
      {width > 0 && (
        <>
          <Plot points={points} faded={faded} breaks={breaks} width={width} min={min} max={max} ticks={ticks} step={step} formatTick={formatTick} />
          {/* The selected dot, bigger, over its small one. */}
          {selected >= 0 && selected < points.length && (
            <Svg width={width} height={PROGRESS_CHART_SIZES.plotHeight + 1} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Circle cx={x(selected)} cy={y(points[selected].value)} r={4} fill={COLORS.primary} />
            </Svg>
          )}
        </>
      )}
    </Pressable>
  );
});

// Everything but the selected dot: grid, axes, line, dots and labels.
const Plot = memo(function Plot({
  points,
  faded,
  breaks = [],
  width,
  min,
  max,
  ticks,
  step,
  formatTick,
}: PlotProps) {
  const right = width - PROGRESS_CHART_SIZES.rightGap;
  const x = (i: number) => (points.length > 1 ? PROGRESS_CHART_SIZES.left + ((right - PROGRESS_CHART_SIZES.left) * i) / (points.length - 1) : (PROGRESS_CHART_SIZES.left + right) / 2);
  const y = (v: number) => PROGRESS_CHART_SIZES.plotHeight - ((v - min) / (max - min)) * PROGRESS_CHART_SIZES.plotHeight;
  const labelEvery = Math.ceil(points.length / PROGRESS_CHART_LIMITS.maxXLabels);
  // The line, one piece per stretch at the same gym: [from, to).
  const starts = [0, ...breaks];
  const runs = starts.map((from, i) => [from, starts[i + 1] ?? points.length] as const);
  return (
    <>
      <Svg width={width} height={PROGRESS_CHART_SIZES.plotHeight + 1} style={StyleSheet.absoluteFill}>
        {ticks.map((t) => (
          <Line key={t} x1={PROGRESS_CHART_SIZES.left} x2={right} y1={y(t)} y2={y(t)} stroke={COLORS.chartGrid} strokeWidth={StyleSheet.hairlineWidth} />
        ))}
        <Line x1={PROGRESS_CHART_SIZES.left} x2={PROGRESS_CHART_SIZES.left} y1={0} y2={PROGRESS_CHART_SIZES.plotHeight} stroke={COLORS.track} strokeWidth={StyleSheet.hairlineWidth} />
        <Line x1={PROGRESS_CHART_SIZES.left} x2={right} y1={PROGRESS_CHART_SIZES.plotHeight} y2={PROGRESS_CHART_SIZES.plotHeight} stroke={COLORS.track} strokeWidth={StyleSheet.hairlineWidth} />
        {breaks.map((b) => (
          <Line
            key={`break${b}`}
            x1={(x(b - 1) + x(b)) / 2}
            x2={(x(b - 1) + x(b)) / 2}
            y1={0}
            y2={PROGRESS_CHART_SIZES.plotHeight}
            stroke={COLORS.textSecondary}
            strokeWidth={StyleSheet.hairlineWidth}
            strokeDasharray="3 3"
          />
        ))}
        {runs.map(([from, to]) => (
          <Polyline
            key={`run${from}`}
            points={points.slice(from, to).map((p, i) => `${x(from + i)},${y(p.value)}`).join(' ')}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth={1.9}
            strokeLinejoin="round"
            opacity={faded?.[from] ? CHART_FADED_OPACITY : 1}
          />
        ))}
        {points.map((p, i) => (
          <Circle key={i} cx={x(i)} cy={y(p.value)} r={2.7} fill={COLORS.primary} opacity={faded?.[i] ? CHART_FADED_OPACITY : 1} />
        ))}
      </Svg>
      {ticks.map((t) => (
        <Text key={t} style={[styles.tick, styles.yTick, { top: y(t) - 7 }]}>
          {formatTick(t, step)}
        </Text>
      ))}
      {points.map((p, i) =>
        (points.length - 1 - i) % labelEvery === 0 ? (
          <Text key={i} style={[styles.tick, styles.xTick, { left: x(i) - 30 }]}>
            {p.label}
          </Text>
        ) : null
      )}
    </>
  );
});

const styles = StyleSheet.create({
  chart: {
    height: PROGRESS_CHART_SIZES.plotHeight + PROGRESS_CHART_SIZES.xLabelGap + 14,
  },
  tick: {
    position: 'absolute',
    ...TYPE.tick,
    lineHeight: LINE_HEIGHTS.tight,
    color: COLORS.textSecondary,
  },
  yTick: {
    fontSize: FONT_SIZES.micro,
    left: 0,
    width: PROGRESS_CHART_SIZES.labelRight,
    textAlign: 'right',
  },
  xTick: {
    top: PROGRESS_CHART_SIZES.plotHeight + PROGRESS_CHART_SIZES.xLabelGap - 2,
    width: PROGRESS_CHART_SIZES.xTickWidth,
    textAlign: 'center',
  },
});
