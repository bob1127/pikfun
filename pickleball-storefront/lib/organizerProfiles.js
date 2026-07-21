import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/coachProfileFields";

export const organizerSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const ORGANIZER_PUBLIC_FIELDS =
  "id,slug,display_name,title,avatar,cover_image,city,region,excerpt,bio,story,specialties,tags,instagram,line_url,instagram_url,facebook_url,contact_email,published,created_at,updated_at";

const safeSocialUrl = (value) =>
  /^https?:\/\//i.test(String(value || "").trim())
    ? String(value).trim()
    : "";

export function dbRowToOrganizer(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    title: row.title || "",
    avatar: row.avatar || "",
    cover_image: row.cover_image || "",
    city: row.city || "",
    region: row.region || "",
    excerpt: row.excerpt || "",
    bio: row.bio || "",
    story: row.story || "",
    specialties: row.specialties || [],
    tags: row.tags || [],
    instagram: row.instagram || "",
    line_url: safeSocialUrl(row.line_url),
    instagram_url: safeSocialUrl(
      row.instagram_url ||
        (row.instagram
          ? `https://www.instagram.com/${String(row.instagram).replace("@", "")}`
          : ""),
    ),
    facebook_url: safeSocialUrl(row.facebook_url),
    contact_email: row.contact_email || "",
    published: row.published !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function uniqueSlug(base, memberId) {
  const fallback = `host-${String(memberId).replace(/[^a-z0-9]/gi, "").slice(-10)}`;
  const root = slugify(base) || fallback || `host-${Date.now()}`;
  for (let index = 0; index < 20; index += 1) {
    const candidate = index ? `${root}-${index + 1}` : root;
    const { data, error } = await organizerSupabase
      .from("organizer_profiles")
      .select("member_id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.member_id === memberId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function ensureOrganizerProfile(customer) {
  const { data: existing, error: findError } = await organizerSupabase
    .from("organizer_profiles")
    .select("*")
    .eq("member_id", customer.id)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) {
    const patch = {};
    if (!existing.avatar && customer.avatar) patch.avatar = customer.avatar;
    if (!existing.owner_email) patch.owner_email = customer.email;
    if (Object.keys(patch).length) {
      const { data, error } = await organizerSupabase
        .from("organizer_profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }
    return existing;
  }

  const slug = await uniqueSlug(customer.name, customer.id);
  const { data, error } = await organizerSupabase
    .from("organizer_profiles")
    .insert({
      member_id: customer.id,
      owner_email: customer.email,
      slug,
      display_name: customer.name,
      avatar: customer.avatar,
      title: "匹克球活動策辦人",
      published: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function loadOrganizerBySlug(slug) {
  const { data, error } = await organizerSupabase
    .from("organizer_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadOrganizerSessions(ownerEmail) {
  const { data, error } = await organizerSupabase
    .from("play_sessions")
    .select(
      "id,title,description,location_name,location_address,starts_at,ends_at,max_players,skill_level,host_name,host_avatar,fee_per_person,status,created_at",
    )
    .eq("host_email", ownerEmail)
    .order("starts_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data || [];
}

export async function profileMapForEmails(emails) {
  const values = [...new Set((emails || []).filter(Boolean).map((v) => v.toLowerCase()))];
  if (!values.length) return new Map();
  const { data, error } = await organizerSupabase
    .from("organizer_profiles")
    .select("owner_email,slug,display_name,title,avatar,excerpt")
    .in("owner_email", values)
    .eq("published", true);
  if (error) return new Map();
  return new Map((data || []).map((row) => [row.owner_email.toLowerCase(), row]));
}
