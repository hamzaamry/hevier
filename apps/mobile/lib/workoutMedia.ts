import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { MAX_MEDIA_PER_PICK } from '@/constants/training';
import { STORAGE_FOLDERS } from '@/constants/storage';
import type { MediaItem } from '@/types/workout';

// Photos and videos of a workout (Save Workout, the workout page, Edit Workout). The picker hands out
// temporary copies, so each one is copied into the app's documents (media/);
// the workout keeps only the file names.


function folder() {
  const dir = new Directory(Paths.document, STORAGE_FOLDERS.media);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function mediaUri(file: string): string {
  return new File(Paths.document, STORAGE_FOLDERS.media, file).uri;
}

// The phone's photo picker (no permission needed); null when nothing was picked.
export async function pickMedia(): Promise<MediaItem[] | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: MAX_MEDIA_PER_PICK,
    quality: 1,
  });
  return result.canceled ? null : keepAssets(result.assets);
}

// The camera, one photo or video; null when cancelled or the camera permission is refused.
export async function takeMedia(): Promise<MediaItem[] | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) return null;
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 1 });
  return result.canceled ? null : keepAssets(result.assets);
}

// Copied into media/ before anything is written to the database, so a crash can't leave a row with no file.
async function keepAssets(assets: ImagePicker.ImagePickerAsset[]): Promise<MediaItem[]> {
  const dir = folder();
  const items: MediaItem[] = [];
  for (const asset of assets) {
    const kind = asset.type === 'video' ? 'video' : 'photo';
    const ext = (asset.fileName?.split('.').pop() || asset.uri.split('.').pop() || (kind === 'video' ? 'mp4' : 'jpg'))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const name = `${Crypto.randomUUID()}.${ext}`;
    await new File(asset.uri).copy(new File(dir, name));
    items.push({ file: name, kind });
  }
  return items;
}

// Discarded or deleted: the files go too. A missing file is fine.
export function deleteMediaFiles(files: string[]) {
  for (const name of files) {
    try {
      const file = new File(Paths.document, STORAGE_FOLDERS.media, name);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('[media] could not delete', name, e);
    }
  }
}
