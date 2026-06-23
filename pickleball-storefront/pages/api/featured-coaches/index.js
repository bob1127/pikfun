import {
  loadAllFeaturedCoaches,
  loadFeaturedCoachBySlug,
} from "@/lib/featuredCoaches";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { region, city, tag } = req.query;
    const data = await loadAllFeaturedCoaches();
    let coaches = data.coaches || [];

    if (region) {
      coaches = coaches.filter((c) => c.region === region);
    }
    if (city) {
      coaches = coaches.filter((c) => c.city === city);
    }
    if (tag) {
      coaches = coaches.filter((c) =>
        (c.tags || []).some((t) => t.includes(tag))
      );
    }

    return res.status(200).json({
      updated_at: data.updated_at,
      count: coaches.length,
      coaches,
    });
  } catch {
    return res.status(500).json({ error: "教練資料載入失敗" });
  }
}
