import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

/** The private Storage bucket with one folder per person (see the profile photos migration). */
const BUCKET = 'avatars';
/** Side of the square that is uploaded, in pixels: sharp at any size the app shows. */
const PHOTO_SIZE = 640;
const JPEG_QUALITY = 0.8;
/** Very large photos are scaled down while they load, to spare memory. */
const MAX_SOURCE_SIDE = 2048;
/** How long a link to a photo works. */
const LINK_SECONDS = 60 * 60;

/**
 * Opens the photo library and resolves to the chosen photo, or null when nothing was chosen.
 * Call it right from a press: browsers open the file picker only in reaction to the person's
 * own action. On the web, closing the picker may never resolve, so nothing should wait for it.
 */
export async function pickPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Android and iOS let people crop to a square; on the web preparePhoto() takes the middle.
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/** A photo ready to upload, and a local link to show it before it is saved. */
export type PreparedPhoto = { uri: string; data: ArrayBuffer };

/** The middle square of the photo as a JPEG of at most PHOTO_SIZE pixels. */
export async function preparePhoto(uri: string): Promise<PreparedPhoto> {
  const original = await ImageManipulator.manipulate(uri, {
    maxWidth: MAX_SOURCE_SIDE,
    maxHeight: MAX_SOURCE_SIDE,
  }).renderAsync();
  const side = Math.min(original.width, original.height);
  const square = await ImageManipulator.manipulate(original)
    .crop({
      originX: Math.floor((original.width - side) / 2),
      originY: Math.floor((original.height - side) / 2),
      width: side,
      height: side,
    })
    .resize({ width: Math.min(side, PHOTO_SIZE) })
    .renderAsync();
  const saved = await square.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true });
  if (!saved.base64) throw new Error('The photo could not be read.');
  // An ArrayBuffer, which is what Supabase Storage accepts on React Native as well as on the web.
  const data = Uint8Array.from(atob(saved.base64), (char) => char.charCodeAt(0)).buffer;
  return { uri: saved.uri, data };
}

/** Uploads a prepared photo into the person's folder and resolves to its path. */
export async function uploadPhoto(userId: string, photo: ArrayBuffer): Promise<string> {
  // A new name for every photo, so an old link never shows the new one or the other way round.
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const path = `${userId}/${name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, photo, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Removes a photo that is no longer used. A failure only leaves a stray file behind. */
export async function removePhoto(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn('Could not remove an old profile photo:', error.message);
}

/** A temporary link to the photo at this path; null without a photo and while the link is made. */
export function usePhotoUrl(path: string | null): string | null {
  const [link, setLink] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!path) return;
    let current = true;
    void supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, LINK_SECONDS)
      .then(({ data }) => {
        if (current && data) setLink({ path, url: data.signedUrl });
      });
    return () => {
      current = false;
    };
  }, [path]);

  return link?.path === path ? link.url : null;
}
