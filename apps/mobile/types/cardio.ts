import type { FOOTBALL_RATINGS } from '@/constants/cardio';

// How hard a cardio session was: one of FOOTBALL_RATINGS.
export type FootballRating = (typeof FOOTBALL_RATINGS)[number];
