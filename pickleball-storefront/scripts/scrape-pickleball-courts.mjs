/**
 * 合併抓取全台匹克球場：
 * - 中華民國匹克球協會 https://pickleball.org.tw/stadium/
 * - 匹克球中毒者社群 https://ipickleball.tw/places/
 *
 * 執行：npm run scrape:courts
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../data/pickleball-courts.json");

const CITY_SUFFIX = {
  台北: "台北市",
  台北市: "台北市",
  新北: "新北市",
  新北市: "新北市",
  台中: "台中市",
  台中市: "台中市",
  桃園: "桃園市",
  桃園市: "桃園市",
  新竹: "新竹市",
  新竹市: "新竹市",
  新竹縣: "新竹縣",
  宜蘭: "宜蘭縣",
  宜蘭縣: "宜蘭縣",
  彰化: "彰化縣",
  彰化縣: "彰化縣",
  高雄: "高雄市",
  高雄市: "高雄市",
  台南: "台南市",
  台南市: "台南市",
  嘉義: "嘉義市",
  嘉義市: "嘉義市",
  嘉義縣: "嘉義縣",
  南投: "南投縣",
  南投縣: "南投縣",
  雲林: "雲林縣",
  雲林縣: "雲林縣",
  屏東: "屏東縣",
  屏東縣: "屏東縣",
  基隆: "基隆市",
  基隆市: "基隆市",
  花蓮: "花蓮縣",
  花蓮縣: "花蓮縣",
  苗栗: "苗栗縣",
  苗栗縣: "苗栗縣",
  澎湖: "澎湖縣",
  澎湖縣: "澎湖縣",
  台東: "台東縣",
  台東縣: "台東縣",
  金門: "金門縣",
  金門縣: "金門縣",
  馬祖: "連江縣",
  連江: "連江縣",
  連江縣: "連江縣",
  國外: "國外",
};

function normalizeCity(raw, region) {
  const r = (region || "").replace(/臺/g, "台").trim();
  if (r && (r.endsWith("市") || r.endsWith("縣"))) return r;
  const c = (raw || "").replace(/臺/g, "台").trim();
  return CITY_SUFFIX[c] || c;
}

function normalizeType(raw) {
  const t = (raw || "").trim();
  if (t.includes("室內")) return { court_type: "indoor", court_type_label: "室內" };
  if (t.includes("風雨")) return { court_type: "covered", court_type_label: "風雨球場" };
  return { court_type: "outdoor", court_type_label: "室外" };
}

function detectTypeFromText(...parts) {
  const text = parts.filter(Boolean).join(" ");
  if (/室內|冷氣|空調/.test(text)) {
    return { court_type: "indoor", court_type_label: "室內" };
  }
  if (/風雨球場|風雨/.test(text)) {
    return { court_type: "covered", court_type_label: "風雨球場" };
  }
  if (/室外|戶外|公園|河濱|公立/.test(text)) {
    return { court_type: "outdoor", court_type_label: "室外" };
  }
  return { court_type: "outdoor", court_type_label: "室外" };
}

function normalizeName(name) {
  return (name || "")
    .replace(/\s+/g, "")
    .replace(/[|｜]/g, "")
    .toLowerCase();
}

function slugify(city, name, address) {
  return `${city}-${name}-${address}`
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .slice(0, 100);
}

function buildAddress(place) {
  let street = (place.street || "").replace(/\s*\(附近\)\s*/g, "").trim();
  const region = (place.region || "").replace(/臺/g, "台");
  const district = place.city || "";

  if (street && /[市縣]/.test(street)) return street;
  if (street && region) return `${region}${district}${street}`.replace(/^台/, match => match);
  if (street) return street;
  if (region && district) return `${region}${district}`;
  return region || district || "";
}

function mergeDedupe(courts) {
  const map = new Map();

  const score = (c) =>
    (c.address?.length || 0) +
    (c.source?.includes("ipickleball") ? 200 : 0) +
    (c.latitude ? 80 : 0) +
    (c.fee_hint ? 10 : 0);

  for (const c of courts) {
    const key = `${c.city}|${normalizeName(c.name)}`;
    const existing = map.get(key);
    if (!existing || score(c) > score(existing)) {
      map.set(key, c);
    }
  }
  return [...map.values()];
}

async function scrapeAssociation() {
  console.log("Fetching pickleball.org.tw/stadium/ ...");
  const res = await fetch("https://pickleball.org.tw/stadium/", {
    headers: { "User-Agent": "PikPie/1.0 (court directory)" },
  });
  const html = await res.text();
  const tableMatch = html.match(/id="tablepress-1"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) return [];

  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const courts = [];

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(
      (c) =>
        c[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
    );
    if (cells.length < 4 || cells[0] === "縣市") continue;

    const [city, name, typeRaw, address] = cells;
    if (!city?.match(/市|縣/) || !name || !address) continue;
    if (address.match(/^(每週|週|星期|AM|PM|每天)/)) continue;

    courts.push({
      city,
      name,
      ...normalizeType(typeRaw),
      address,
      source: "中華民國匹克球協會",
      source_url: "https://pickleball.org.tw/stadium/",
    });
  }
  return courts;
}

async function scrapeIPickleball() {
  console.log("Fetching ipickleball.tw/places/ (GeoDirectory API) ...");
  const courts = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `https://ipickleball.tw/wp-json/geodir/v2/places?per_page=100&page=${page}&status=publish`;
    const res = await fetch(url, {
      headers: { "User-Agent": "PikPie/1.0 (court directory)" },
    });
    if (!res.ok) break;

    totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) break;

    for (const p of data) {
      const catName = p.post_category?.[0]?.name || "";
      const city = normalizeCity(catName, p.region);
      const name = p.title?.raw || p.title?.rendered || "";
      const address = buildAddress(p);
      if (!name || !address) continue;

      const excerpt = p.uagb_excerpt || "";
      const content = p.content?.raw || "";
      const feeKey = Object.keys(p).find((k) => k.startsWith("cf") && typeof p[k] === "string" && /\d/.test(p[k]));
      const fee_hint = feeKey ? p[feeKey] : null;

      courts.push({
        city,
        name,
        ...detectTypeFromText(name, excerpt, content),
        address,
        latitude: p.latitude ? Number(p.latitude) : null,
        longitude: p.longitude ? Number(p.longitude) : null,
        fee_hint,
        link: p.link || null,
        source: "ipickleball.tw",
        source_url: "https://ipickleball.tw/places/",
      });
    }

    console.log(`  page ${page}/${totalPages} (+${data.length})`);
    page += 1;
  }

  return courts;
}

async function main() {
  const [association, ipickleball] = await Promise.all([
    scrapeAssociation(),
    scrapeIPickleball(),
  ]);

  console.log(`Association: ${association.length}, ipickleball: ${ipickleball.length}`);

  let courts = mergeDedupe([...association, ...ipickleball]);
  courts.sort(
    (a, b) =>
      a.city.localeCompare(b.city, "zh-TW") ||
      a.name.localeCompare(b.name, "zh-TW")
  );

  courts = courts.map((c, i) => ({
    id: slugify(c.city, c.name, c.address) || `court-${i}`,
    ...c,
  }));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        sources: [
          "https://pickleball.org.tw/stadium/",
          "https://ipickleball.tw/places/",
        ],
        count: courts.length,
        courts,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Merged ${courts.length} unique courts → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
