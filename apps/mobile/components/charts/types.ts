import type { MuscleCount } from '@/types/stats';
import type { ReactNode } from 'react';

// Props of the chart pieces in components/charts/.

// One choice of a range menu ("Last 3 months").
export interface RangeOption {
  label: string;
}

export interface RangeSheetProps {
  visible: boolean;
  ranges: readonly RangeOption[];
  // The index of the range now shown.
  range: number;
  onPick: (index: number) => void;
  onDismiss: () => void;
}

export interface ChartHeaderProps {
  // The big number and its date or period, left of the range button (one line).
  children: ReactNode;
  ranges: readonly RangeOption[];
  range: number;
  onRange: (index: number) => void;
}

export interface BarChartProps {
  values: number[];
  labels: string[];
  max: number;
  ticks: number[];
  formatTick: (value: number) => string;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export interface MuscleBarsProps {
  counts: MuscleCount[];
  limit?: number;
  colorOf?: (sets: number) => string;
}

export interface PeriodNavProps {
  label: string;
  onPrevious?: () => void; // undefined greys the arrow out
  onNext?: () => void;
}

export interface ProgressChartProps {
  points: ChartPoint[];
  formatTick: (value: number, step: number) => string;
  selected: number;
  onSelect: (index: number) => void;
  // Points drawn faded, and the indices where the line breaks (a gym change).
  faded?: boolean[];
  breaks?: number[];
}

export interface PlotProps {
  points: ChartPoint[];
  faded?: boolean[];
  breaks?: number[];
  width: number;
  min: number;
  max: number;
  ticks: number[];
  step: number;
  formatTick: (value: number, step: number) => string;
}

export interface ChartPoint {
  label: string; // under the dot, e.g. "Oct 6"
  value: number;
}
