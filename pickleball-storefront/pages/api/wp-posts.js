import {
  fetchPostsByCategorySlug,
  mapPostToStoreCard,
  mapPostToCarouselItem,
  WP_CATEGORY,
} from "@/lib/wordpress";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, per_page: perPage = "10", lang } = req.query;

  if (!category || !WP_CATEGORY[category]) {
    return res.status(400).json({
      error: "category 需為 active 或 knowledge",
    });
  }

  try {
    const raw = await fetchPostsByCategorySlug(category, {
      perPage: Number(perPage) || 10,
      lang,
    });

    const meta = WP_CATEGORY[category];
    const posts =
      category === "active"
        ? raw.map((p, i) => mapPostToStoreCard(p, i, meta.label))
        : raw.map((p) => mapPostToCarouselItem(p));

    return res.status(200).json({
      posts,
      count: posts.length,
      category: meta,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "載入失敗" });
  }
}
