import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { COLORS, FILTER_ICON_COLORS } from '@/constants/theme';
import type { EquipmentGroup } from '@/types/equipment';
import type { MuscleGroup } from '@/types/muscles';
import { FILTER_ICONS_SIZES } from '@/constants/sizes';
import type { EquipmentIconProps, FigureProps, FilterIconProps, MuscleIconProps, Region, Shape } from './types';

// Pictures for the Equipment / Muscle Group cards: a white disc with a grey glyph, or a small body figure, front or
// back, with the muscle in blue. Drawn on a 40x40 grid.

const INK = FILTER_ICON_COLORS.ink; // equipment glyphs
const BODY = FILTER_ICON_COLORS.body; // figure
const HIGHLIGHT = COLORS.primary;

// Glyphs fill the 40x40 grid; a figure only spans x 9-31, so it gets a
// tighter view to fill the disc.
function FilterIcon({ children, figure }: FilterIconProps) {
  return (
    <View style={styles.disc}>
      <Svg width={figure ? 28.4 : 38} height={figure ? 44 : 38} viewBox={figure ? '7 0.5 26 40.3' : '0 0 40 40'}>
        {children}
      </Svg>
    </View>
  );
}

export function EquipmentIcon({ group }: EquipmentIconProps) {
  return <FilterIcon figure={group === 'None'}>{EQUIPMENT[group]}</FilterIcon>;
}

export function MuscleIcon({ group }: MuscleIconProps) {
  if (group === 'Cardio') {
    return (
      <FilterIcon>
        <Path
          d="M20 33 C9 25 6 19.5 6 15 C6 10.5 9.5 7.5 13.3 7.5 C16.3 7.5 18.6 9.3 20 11.6 C21.4 9.3 23.7 7.5 26.7 7.5 C30.5 7.5 34 10.5 34 15 C34 19.5 31 25 20 33 Z"
          fill={HIGHLIGHT}
        />
      </FilterIcon>
    );
  }
  if (group === 'Other') return <EquipmentIcon group="Other" />;
  const back = BACK_MUSCLES.includes(group);
  return (
    <FilterIcon figure>
      <Figure view={back ? 'back' : 'front'} highlight={group === 'Full Body' ? 'all' : group} />
    </FilterIcon>
  );
}

// ---- Body figure ----



const rect = (region: Region, x: number, y: number, w: number, h: number, r = 1.2): Shape => ({
  region,
  kind: 'rect',
  x,
  y,
  w,
  h,
  r,
});
const circle = (region: Region, cx: number, cy: number, r: number): Shape => ({ region, kind: 'circle', cx, cy, r });
const path = (region: Region, d: string): Shape => ({ region, kind: 'path', d });
// Head, neck, shoulders and hands: the same from the front and the back.
const SHARED: Shape[] = [
  circle('base', 20, 4.4, 3.1),
  rect('Neck', 18.7, 7, 2.6, 2.6, 0.6),
  circle('Shoulders', 14.2, 11.9, 2.3),
  circle('Shoulders', 25.8, 11.9, 2.3),
  circle('base', 11.5, 26.4, 1.1),
  circle('base', 28.5, 26.4, 1.1),
];

const FRONT: Shape[] = [
  ...SHARED,
  path('Traps', 'M18.7 9.4 L15 10.7 L18.7 11.2 Z'),
  path('Traps', 'M21.3 9.4 L25 10.7 L21.3 11.2 Z'),
  rect('Chest', 15.5, 10.7, 4.3, 4.6, 1.6),
  rect('Chest', 20.2, 10.7, 4.3, 4.6, 1.6),
  rect('Lats', 14.7, 15.4, 1.6, 5.4, 0.8),
  rect('Lats', 23.7, 15.4, 1.6, 5.4, 0.8),
  rect('Abdominals', 16.7, 15.7, 6.6, 7.6, 1.4),
  path('base', 'M16.2 23.7 L23.8 23.7 L23.1 26.5 L16.9 26.5 Z'),
  rect('Biceps', 11.3, 13.5, 2.6, 5.4, 1.3),
  rect('Biceps', 26.1, 13.5, 2.6, 5.4, 1.3),
  rect('Forearms', 10.5, 19.3, 2.4, 6, 1.2),
  rect('Forearms', 27.1, 19.3, 2.4, 6, 1.2),
  rect('Abductors', 14.9, 23.8, 1.6, 4.4, 0.8),
  rect('Abductors', 23.5, 23.8, 1.6, 4.4, 0.8),
  rect('Quadriceps', 16, 26.8, 3.2, 8.2, 1.5),
  rect('Quadriceps', 20.8, 26.8, 3.2, 8.2, 1.5),
  rect('Adductors', 19.35, 26.9, 1.3, 5.2, 0.65),
  rect('Calves', 16.4, 35.4, 2.8, 4.2, 1.2),
  rect('Calves', 20.8, 35.4, 2.8, 4.2, 1.2),
];

const BACK: Shape[] = [
  ...SHARED,
  rect('Upper Back', 15.4, 11, 9.2, 6.4, 1.4),
  path('Traps', 'M20 8.8 L16.2 10.9 L20 13.6 L23.8 10.9 Z'),
  path('Lats', 'M15 15.4 L19.6 18 L19.6 21.8 L16 20.8 Z'),
  path('Lats', 'M25 15.4 L20.4 18 L20.4 21.8 L24 20.8 Z'),
  rect('Lower Back', 17.5, 20.4, 5, 3.2, 1),
  rect('Triceps', 11.3, 13.5, 2.6, 5.4, 1.3),
  rect('Triceps', 26.1, 13.5, 2.6, 5.4, 1.3),
  rect('Forearms', 10.5, 19.3, 2.4, 6, 1.2),
  rect('Forearms', 27.1, 19.3, 2.4, 6, 1.2),
  rect('Glutes', 16, 23.5, 3.8, 4.1, 1.8),
  rect('Glutes', 20.2, 23.5, 3.8, 4.1, 1.8),
  rect('Hamstrings', 16, 27.9, 3.6, 7.1, 1.6),
  rect('Hamstrings', 20.4, 27.9, 3.6, 7.1, 1.6),
  rect('Calves', 16.3, 35.4, 3, 4.2, 1.4),
  rect('Calves', 20.7, 35.4, 3, 4.2, 1.4),
];

// Muscles seen from behind.
const BACK_MUSCLES: MuscleGroup[] = ['Lats', 'Lower Back', 'Traps', 'Triceps', 'Upper Back', 'Glutes', 'Hamstrings', 'Calves'];

function Figure({ view, highlight }: FigureProps) {
  return (
    <>
      {(view === 'front' ? FRONT : BACK).map((sh, i) => {
        const fill = highlight === 'all' || sh.region === highlight ? HIGHLIGHT : BODY;
        if (sh.kind === 'rect') return <Rect key={i} x={sh.x} y={sh.y} width={sh.w} height={sh.h} rx={sh.r} fill={fill} />;
        if (sh.kind === 'circle') return <Circle key={i} cx={sh.cx} cy={sh.cy} r={sh.r} fill={fill} />;
        return <Path key={i} d={sh.d} fill={fill} />;
      })}
    </>
  );
}

// ---- Equipment glyphs ----

const EQUIPMENT: Record<EquipmentGroup, React.ReactNode> = {
  // A plain standing figure: no equipment.
  None: <Figure view="front" highlight={null} />,
  Barbell: (
    <>
      <Rect x={3} y={19} width={34} height={2} rx={1} fill={INK} />
      <Rect x={7.5} y={12} width={3.4} height={16} rx={1.2} fill={INK} />
      <Rect x={11.4} y={14.5} width={2.4} height={11} rx={1} fill={INK} />
      <Rect x={29.1} y={12} width={3.4} height={16} rx={1.2} fill={INK} />
      <Rect x={26.2} y={14.5} width={2.4} height={11} rx={1} fill={INK} />
    </>
  ),
  Dumbbell: (
    <>
      <Rect x={13} y={18.6} width={14} height={2.8} rx={1.2} fill={INK} />
      <Rect x={7} y={13} width={6.5} height={14} rx={2.2} fill={INK} />
      <Rect x={26.5} y={13} width={6.5} height={14} rx={2.2} fill={INK} />
    </>
  ),
  Kettlebell: (
    <>
      <Path d="M12 20 L11.2 12.5 C11 8.8 14 6.5 20 6.5 C26 6.5 29 8.8 28.8 12.5 L28 20" stroke={INK} strokeWidth={3} fill="none" strokeLinejoin="round" />
      <Circle cx={20} cy={25} r={10} fill={INK} />
    </>
  ),
  Machine: (
    <>
      <Rect x={8} y={5} width={24} height={30} rx={1.5} stroke={INK} strokeWidth={2} fill="none" />
      <Path d="M20 6 L20 18" stroke={INK} strokeWidth={1.4} />
      <Rect x={13} y={18} width={14} height={3} rx={0.8} fill={INK} />
      <Rect x={13} y={22.2} width={14} height={3} rx={0.8} fill={INK} />
      <Rect x={13} y={26.4} width={14} height={3} rx={0.8} fill={INK} />
      <Rect x={13} y={30.6} width={14} height={3} rx={0.8} fill={INK} />
    </>
  ),
  // A pulley, its cable and a stirrup handle.
  Cable: (
    <>
      <Circle cx={20} cy={9} r={4.6} stroke={INK} strokeWidth={2} fill="none" />
      <Circle cx={20} cy={9} r={1.3} fill={INK} />
      <Rect x={19.1} y={13.4} width={1.8} height={12.6} fill={INK} />
      <Path d="M20 26 L13 33 L27 33 Z" stroke={INK} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Rect x={12} y={32} width={16} height={3} rx={1.2} fill={INK} />
    </>
  ),
  Plate: (
    <>
      <Circle cx={20} cy={20} r={14.5} fill={INK} />
      <Circle cx={20} cy={20} r={10} stroke={COLORS.white} strokeWidth={1.2} fill="none" />
      <Circle cx={20} cy={20} r={3} fill={COLORS.white} />
    </>
  ),
  'Resistance Band': (
    <Rect x={7} y={13} width={26} height={14} rx={7} stroke={HIGHLIGHT} strokeWidth={3.4} fill="none" transform="rotate(-30 20 20)" />
  ),
  'Suspension Band': (
    <>
      <Circle cx={20} cy={6} r={2.4} fill={INK} />
      <Path d="M19 8 L13 29 M21 8 L27 29" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={9.5} y={29} width={7} height={3.2} rx={1.6} fill={INK} />
      <Rect x={23.5} y={29} width={7} height={3.2} rx={1.6} fill={INK} />
    </>
  ),
  Other: (
    <>
      <Circle cx={12} cy={20} r={2.4} fill={INK} />
      <Circle cx={20} cy={20} r={2.4} fill={INK} />
      <Circle cx={28} cy={20} r={2.4} fill={INK} />
    </>
  ),
};

const styles = StyleSheet.create({
  disc: {
    width: FILTER_ICONS_SIZES.disc,
    height: FILTER_ICONS_SIZES.disc,
    borderRadius: FILTER_ICONS_SIZES.disc / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FILTER_ICON_COLORS.disc,
  },
});
