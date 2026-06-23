import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "fs";
import { join } from "path";
import { dbRowToCoach } from "@/lib/coachProfileFields";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let jsonCache = null;
let jsonMtime = 0;

function loadJsonCoaches() {
  try {
    const file = join(process.cwd(), "data/featured-coaches.json");
    const mtime = statSync(file).mtimeMs;
    if (jsonCache && mtime === jsonMtime) return jsonCache;
    jsonCache = JSON.parse(readFileSync(file, "utf8"));
    jsonMtime = mtime;
    return jsonCache;
  } catch {
    return { coaches: [] };
  }
}

export async function loadAllFeaturedCoaches() {
  const { data: dbRows } = await supabase
    .from("featured_coaches")
    .select("*")
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });

  const fromDb = (dbRows || []).map(dbRowToCoach).filter(Boolean);
  const jsonData = loadJsonCoaches();
  const fromJson = (jsonData.coaches || []).filter((c) => c.is_featured !== false);

  const slugSet = new Set(fromDb.map((c) => c.slug));
  const merged = [
    ...fromDb,
    ...fromJson.filter((c) => !slugSet.has(c.slug)),
  ].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));

  return {
    updated_at: jsonData.updated_at,
    coaches: merged,
  };
}

export async function loadFeaturedCoachBySlug(slug) {
  const { data: row } = await supabase
    .from("featured_coaches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (row) return dbRowToCoach(row);

  const jsonData = loadJsonCoaches();
  return (jsonData.coaches || []).find((c) => c.slug === slug) || null;
}

export { supabase as coachSupabase };
