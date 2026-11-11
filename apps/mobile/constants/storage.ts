// Every name the app saves data under, in one place, so two features can
// never use the same one by mistake.
//
// Never change a value here: the data already saved under the old name would
// be lost on users' phones. Add a new name instead.

// Keys of the app_state table (small saved values, one row per key).
export const STORAGE_KEYS = {
  activeWorkout: 'activeWorkout', // the workout being logged (db/activeWorkout/draft.ts)
  rotation: 'rotation', // routine ids of the cycle, in order (db/rotation/cycle.ts)
  rotationSkip: 'rotationSkip', // a skipped step of the cycle (db/rotation/cycle.ts)
  perHand: 'perHand', // exercises logged per hand (db/perHand/perHand.ts)
  workoutSettings: 'workoutSettings', // the Workout Settings screen (db/workoutSettings.ts)
  runSettings: 'run.settings', // run readiness on / off and the run time (db/run/settings.ts)
  profileName: 'profile.name',
  profileUsername: 'profile.username',
  profilePhoto: 'profile.photo', // file name in documents/profile (stores/profilePhoto.ts)
  profileDrawings: 'profile.drawings', // 'male' or 'female' exercise pictures (stores/drawings.ts)
  onboardingDone: 'onboarding.done', // the first-launch questions were answered or skipped (db/onboarding)
  routinesUnfiledCollapsed: 'routines.unfiledCollapsed', // the routines list's unfiled section folded
};

// AsyncStorage keys (kept outside the database, so a restore leaves them).
export const ASYNC_STORAGE_KEYS = {
  syncPairing: 'hevier.sync.pairing', // the PC paired with (lib/sync/pairing.ts)
  syncLast: 'hevier.sync.last', // time of the last good sync
  syncDeviceId: 'hevier.sync.deviceId', // this phone's id for the PC copy (lib/sync/deviceId.ts)
  restoreUndone: 'hevier.sync.restoreUndone', // a restore the app was closed in was undone at start, not yet told (lib/sync/restoreNotice.ts)
};

// File names.
export const STORAGE_FILES = {
  database: 'hevier.db', // the SQLite database, also its name in a backup
};

// Folders, under the app's documents unless said otherwise.
export const STORAGE_FOLDERS = {
  media: 'media', // workout photos and videos
  profile: 'profile', // the profile photo
  catalogue: 'catalogue', // exercise clips and stills (scripts/load-device.sh)
  sqlite: 'SQLite', // where expo-sqlite keeps the database
  syncCache: 'sync', // in the cache: the database copy sent to the PC
  restoreCache: 'restore', // in the cache: a restore's downloads before they move in
  restoreBackup: 'restore-backup', // the phone's own data, set aside while a restore moves in
  restoreTrash: 'restore-trash', // a finished restore's backup, renamed here so deleting it can be cut short harmlessly
} as const;

// Files a restore leaves in restore-backup to say how far it got: with neither,
// it was still setting the old data aside; with `setAside`, the new data was
// moving in; with `committed`, it finished and only the backup is left to delete.
// (Discarding renames the folder to restore-trash first, markers and all.)
export const RESTORE_MARKERS = {
  setAside: 'SET-ASIDE',
  committed: 'COMMITTED',
} as const;

// The first bytes of a SQLite file (sqlite.org/fileformat2.html).
export const SQLITE_HEADER = {
  length: 100,
  magic: 'SQLite format 3\0',
  userVersionOffset: 60, // the schema version the migrations set
} as const;

// The photo folders a backup sends and a restore replaces.
export const SYNC_FOLDERS = [STORAGE_FOLDERS.media, STORAGE_FOLDERS.profile] as const;

// Keep-awake tags (expo-keep-awake), one per screen that holds the screen on.
export const KEEP_AWAKE_TAGS = {
  logWorkout: 'log-workout',
};

// Addresses the sync talks to besides the paired PC's.
export const SYNC_HOSTS = {
  usb: '127.0.0.1', // over the USB cable (adb reverse maps the phone's port to the PC's)
};

// The highest TCP port a pairing link may name (lib/sync/pairing.ts).
export const MAX_PORT = 65535;

// Hosts that count as a PC on the same network or cable (lib/sync/pairing.ts).
export const LOCAL_HOST_PATTERNS: readonly RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
];

// The home-screen widgets' saved data (Android SharedPreferences). Only the
// Kotlin side reads and writes these (modules/home-widgets/.../HomeWidgets.kt,
// PREFS and KEY): listed here so no other key clashes; they must match it.
export const HOME_WIDGET_PREFS = {
  name: 'hevier_widgets',
  key: 'data',
};
