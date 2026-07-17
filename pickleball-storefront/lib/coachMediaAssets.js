import { coachSupabase } from "@/lib/featuredCoaches";
import { COACH_MEDIA_BUCKET } from "@/lib/coachMediaLimits";

export async function getCoachMediaUsage(coachId) {
  const { data, error } = await coachSupabase
    .from("coach_media_assets")
    .select("media_type, byte_size")
    .eq("coach_id", coachId);

  if (error) throw error;

  const usage = {
    image: { count: 0, bytes: 0 },
    video: { count: 0, bytes: 0 },
  };

  for (const row of data || []) {
    const type = row.media_type === "video" ? "video" : "image";
    usage[type].count += 1;
    usage[type].bytes += Number(row.byte_size) || 0;
  }

  return usage;
}

export async function registerCoachMediaAsset({
  coachId,
  slug,
  mediaType,
  filePath,
  publicUrl,
  byteSize,
}) {
  const { data, error } = await coachSupabase
    .from("coach_media_assets")
    .insert({
      coach_id: coachId,
      slug,
      media_type: mediaType,
      file_path: filePath,
      public_url: publicUrl,
      byte_size: byteSize,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function extractCoachMediaUrls(html, bucket = COACH_MEDIA_BUCKET) {
  if (!html) return [];
  const urls = new Set();
  const patterns = [
    new RegExp(
      `https?://[^"'\\s]+/storage/v1/object/public/${bucket}/[^"'\\s]+`,
      "gi",
    ),
    // Cloudflare R2 公開網址（key 含 coach-media/）
    /https?:\/\/[^"'\s]+\/coach-media\/[^"'\s]+/gi,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(html)) !== null) {
      urls.add(match[0]);
    }
  }
  return [...urls];
}
