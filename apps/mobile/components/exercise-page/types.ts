import type { CATALOGUE_MEDIA_KINDS, EXERCISE_PAGE_TABS } from '@/constants/exercise';
import type { ExerciseDetail } from '@/types/exercise';

// Props and local types of the exercise page pieces (components/exercise-page/).

export type ExercisePageTab = (typeof EXERCISE_PAGE_TABS)[number];

export type CatalogueMediaKind = (typeof CATALOGUE_MEDIA_KINDS)[number];

// Each tab gets the whole exercise.
export interface ExerciseTabProps {
  detail: ExerciseDetail;
}

export interface ExercisePageTabsProps {
  tab: ExercisePageTab;
  onTab: (tab: ExercisePageTab) => void;
}

export interface ExerciseClipProps {
  catalogueId: string | null;
}

export interface GymRecordsInfoSheetProps {
  visible: boolean;
  gymName: string;
  onDismiss: () => void;
}

export interface ClipVideoProps {
  uri: string;
}
