import { readFileSync, statSync } from "fs";
import { join } from "path";
import {
  buildCourtCityTags,
  sortCourtCityTags,
} from "@/lib/courtCities";
import {
  collectDistricts,
  districtMatches,
  sortCourtsByDistance,
} from "@/lib/courtDistrict";

let cache = null;
let cacheMtime = 0;

function loadCourts() {
  const file = join(process.cwd(), "data/pickleball-courts.json");
  const mtime = statSync(file).mtimeMs;
  if (cache && mtime === cacheMtime) return cache;
  cache = JSON.parse(readFileSync(file, "utf8"));
  cacheMtime = mtime;
  return cache;
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { q = "", city = "", district = "", type = "", all = "", lat = "", lng = "" } =
      req.query;
    const data = loadCourts();
    let courts = data.courts || [];

    if (all === "1") {
      return res.status(200).json({
        updated_at: data.updated_at,
        count: courts.length,
        courts: courts.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          city: c.city,
          latitude: c.latitude,
          longitude: c.longitude,
        })),
      });
    }

    if (city) {
      courts = courts.filter((c) => c.city === city);
    }

    const districts = city ? collectDistricts(courts) : [];

    if (district) {
      courts = courts.filter((c) =>
        districtMatches(c.city, c.address, district)
      );
    }
    if (type && type !== "all") {
      courts = courts.filter((c) => c.court_type === type);
    }
    if (q.trim()) {
      const kw = q.trim().toLowerCase();
      courts = courts.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.address.toLowerCase().includes(kw) ||
          c.city.includes(kw)
      );
    }

    if (lat && lng) {
      courts = sortCourtsByDistance(courts, lat, lng);
    } else {
      courts = [...courts].sort((a, b) =>
        a.name.localeCompare(b.name, "zh-TW")
      );
    }

    const cities = [...new Set(data.courts.map((c) => c.city))].sort((a, b) =>
      a.localeCompare(b, "zh-TW")
    );
    const city_tags = sortCourtCityTags(buildCourtCityTags(cities));
    const limit = city ? 200 : 80;

    return res.status(200).json({
      updated_at: data.updated_at,
      sources: data.sources || [data.source_url].filter(Boolean),
      count: courts.length,
      cities,
      city_tags,
      districts,
      courts: courts.slice(0, limit),
    });
  } catch (e) {
    return res.status(500).json({
      error: "球場資料載入失敗，請執行 node scripts/scrape-pickleball-courts.mjs",
    });
  }
}
