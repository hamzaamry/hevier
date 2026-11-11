---
paths:
  - "apps/mobile/app/**"
  - "apps/mobile/components/**"
  - "apps/mobile/constants/**"
  - "apps/web/**"
---

# UI and design system

Where each token lives. The rules are in `AGENTS.md` under "Design system".

| Need | Use | File |
|---|---|---|
| Colour | `COLORS`, `withAlpha(color, alpha)` | `apps/mobile/constants/theme.ts` |
| Text style | `TYPE.*` (weight and size, white by default), `FONTS`, `FONT_SIZES`, `LINE_HEIGHTS` | `apps/mobile/constants/theme.ts` |
| Padding, margin, gap | `SPACE` (4 dp grid), `LAYOUT.screenMargin`, `LAYOUT.cardPadding` | `apps/mobile/constants/layout.ts` |
| Corner radius | `RADIUS` (`button`, `card`, `sheet`, `pill`) | `apps/mobile/constants/layout.ts` |
| Border width | `BORDER_WIDTHS` | `apps/mobile/constants/layout.ts` |
| Touch area | `HIT_SLOPS` | `apps/mobile/constants/layout.ts` |
| Component sizes | `SIZES`, `ICON_SIZES` and one group per component | `apps/mobile/constants/sizes.ts` |
| Motion | `*_MOTION` groups | `apps/mobile/constants/motion.ts` |
| Variants and modes | `BUTTON_VARIANTS`, `BUTTON_SIZES`, `STAT_SIZES`, ... and `PRESSED_OPACITY` | `apps/mobile/constants/ui.ts` |
| Limits and timeouts | `*_LIMITS`, `SYNC_TIMEOUTS` | `apps/mobile/constants/limits.ts`, `motion.ts` |
| Words shown to the user | labels | `apps/mobile/constants/labels.ts` and the feature's constants |

Shared components in `apps/mobile/components/ui/`: `ActionBar`, `Avatar`,
`BottomSheet`, `Button`, `Confetti`, `ConfirmDialog`, `Divider`, `EmptyState`,
`Icons`, `InnerHeader`, `MetricPills`, `NameDialog`, `Pill`, `ReorderList`,
`Screen`, `Stat`, `SwipeToDelete`, `TabHeader`, `Toggle`, `WheelPicker`,
`WorkoutIcon`, `WorkoutPill`. Their props are in `components/ui/types.ts`. Open
the component before you copy its look. There is no `TabBar` component: the
bottom tab bar is native (`apps/mobile/app/(tabs)/_layout.tsx`, drawables from
`apps/mobile/plugins/android-res/`), see `native-modules.md`.

## Checklist for a new screen or component

- Start from `Screen` and `InnerHeader` or `TabHeader`. Margins are `LAYOUT.screenMargin`.
- A new colour, size or number goes into the constants file first, with a short comment saying what it is for.
- Props live in a types file, not inline.
- Every `Pressable`: `accessibilityRole`. Icon-only: `accessibilityLabel`. Toggle or ticked item: `accessibilityState`. Target 48 dp or more, or add `hitSlop`.
- State is never colour only (the set badges use W and F letters, copy that idea).
- Lists that grow use `FlatList` or similar, not `map` inside a `ScrollView`.
- Check it on a small phone, a large system font and with the keyboard open.
- Take before and after screenshots with demo data (`AGENTS.md`, "Verifying UI changes").

## Landing page (`apps/web`)

- No exercise pictures from the catalogue (licence), no Hevy assets, no third-party trackers or fonts loaded from other hosts.
- Say "Android today" and "unofficial, not affiliated with Hevy" near the top.
- Numbers about other apps' prices or limits need a date ("at time of writing") and a check in the store the same week.
- Do not claim "no internet permission": sync uses the network.
