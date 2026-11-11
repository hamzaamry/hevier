#!/usr/bin/env bash
# Loads your Hevy history + exercise library (and the exercise media) into the
# Hevier app on a connected emulator/phone. REPLACES the app's current data.
#
#   apps/mobile/scripts/load-device.sh <workouts.csv>                 # the only connected device
#   apps/mobile/scripts/load-device.sh <workouts.csv> emulator-5554   # a specific device (see: adb devices)
set -euo pipefail

CSV=${1:?usage: apps/mobile/scripts/load-device.sh <workouts.csv> [device]}
CSV=$(cd "$(dirname "$CSV")" && pwd)/$(basename "$CSV") # absolute, before the cd below
cd "$(dirname "$0")/.."
MEDIA=../../packages/catalogue/media
ADB="${ANDROID_HOME:-$HOME/Android/Sdk}/platform-tools/adb"
DEVICE_ARGS=()
[[ $# -ge 2 ]] && DEVICE_ARGS=(-s "$2")
adb() { "$ADB" "${DEVICE_ARGS[@]}" "$@"; }

APP=com.hevier.app
SEED="$(mktemp -d)/hevier-seed.db"

echo "1/4  Building database from $CSV"
npx --yes tsx scripts/import-csv.ts "$CSV" "$SEED"

echo "2/4  Stopping the app"
adb shell am force-stop "$APP"

echo "3/4  Copying database"
adb push "$SEED" /data/local/tmp/hevier-seed.db >/dev/null
adb shell "run-as $APP sh -c 'mkdir -p files/SQLite && rm -f files/SQLite/hevier.db-wal files/SQLite/hevier.db-shm && cp /data/local/tmp/hevier-seed.db files/SQLite/hevier.db'"
adb shell rm -f /data/local/tmp/hevier-seed.db

# The media isn't in the repo (licence: see THIRD-PARTY-NOTICES.md); without it
# the app shows a placeholder instead of each exercise's picture.
if [[ ! -d "$MEDIA" ]]; then
  echo "4/4  No packages/catalogue/media folder: skipping exercise pictures"
  echo "Done. Open Hevier on the device."
  exit 0
fi
echo "4/4  Copying exercise media (~200 MB)"
adb shell rm -rf /data/local/tmp/catalogue
adb push "$MEDIA" /data/local/tmp/catalogue >/dev/null
adb shell "run-as $APP sh -c 'rm -rf files/catalogue && cp -r /data/local/tmp/catalogue files/catalogue'"
adb shell rm -rf /data/local/tmp/catalogue

echo "Done. Open Hevier on the device."
