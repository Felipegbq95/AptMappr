import { getSupabase, isSupabaseConfigured } from "./supabase";

const BUCKET = "apartment-photos";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Downscale an image file to a JPEG data URL. Used in local (no-cloud) mode so
 * a couple of photos fit comfortably in browser storage instead of storing
 * multi-megabyte originals.
 */
export function downscaleToDataUrl(file: File, maxDim = 1024, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image"));
    };
    img.src = url;
  });
}

/**
 * Turn selected files into stored photo URLs.
 *  - Cloud mode: upload to the Supabase Storage bucket, return public URLs.
 *  - Local mode: downscale to inline data URLs.
 */
export async function uploadPhotos(files: File[]): Promise<string[]> {
  const images = files.filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) return [];

  if (!isSupabaseConfigured) {
    return Promise.all(images.map((f) => downscaleToDataUrl(f)));
  }

  const supabase = getSupabase();
  if (!supabase) return Promise.all(images.map((f) => downscaleToDataUrl(f)));

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Please sign in to upload photos.");

  const urls: string[] = [];
  for (const file of images) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${uid()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      throw new Error(
        `Upload failed (${error.message}). Make sure a public Storage bucket named "${BUCKET}" exists — see supabase/schema.sql.`,
      );
    }
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
