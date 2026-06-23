import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** 從 review 讀取投票紀錄（vote_records JSONB 或舊版 review_votes 表） */
function getVoteRecords(review) {
  if (review?.vote_records && typeof review.vote_records === "object") {
    return review.vote_records;
  }
  return {};
}

/** 依 voter_email 查詢該會員在各則評論的投票 */
async function fetchVoteMap(reviewIds, voterEmail) {
  const voteMap = {};
  if (!voterEmail || !reviewIds.length) return voteMap;

  const { data: votes, error } = await supabase
    .from("review_votes")
    .select("review_id, vote_type")
    .in("review_id", reviewIds)
    .eq("voter_email", voterEmail);

  if (!error && votes) {
    for (const v of votes) voteMap[v.review_id] = v.vote_type;
  }
  return voteMap;
}
const parseMissingColumn = (message) => {
  const m = message?.match(/Could not find the '(\w+)' column/);
  return m?.[1] || null;
};

/** 插入時若欄位不存在，自動略過該欄位重試 */
async function insertWithFallback(row) {
  let current = { ...row };
  const extras = {};

  for (let i = 0; i < 10; i++) {
    const result = await supabase.from("reviews").insert([current]).select().single();
    if (!result.error) {
      return { data: { ...result.data, ...extras }, error: null };
    }
    const missing = parseMissingColumn(result.error.message);
    if (!missing || !(missing in current)) return result;
    if (current[missing] != null) extras[missing] = current[missing];
    const next = { ...current };
    delete next[missing];
    current = next;
  }
  return { data: null, error: { message: "插入失敗" } };
}

/** 更新時若欄位不存在，自動略過該欄位重試 */
async function updateWithFallback(id, patch) {
  let current = { ...patch };

  for (let i = 0; i < 10; i++) {
    const result = await supabase.from("reviews").update(current).eq("id", id).select().single();
    if (!result.error) return result;
    const missing = parseMissingColumn(result.error.message);
    if (!missing || !(missing in current)) return result;
    const next = { ...current };
    delete next[missing];
    current = next;
  }
  return { data: null, error: { message: "更新失敗" } };
}

export default async function handler(req, res) {
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ error: "缺少 product_id" });
  }

  // GET：取得評論列表（可帶 voter_email 回傳該會員的投票狀態）
  if (req.method === "GET") {
    const { voter_email } = req.query;

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product_id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    let externalVoteMap = {};
    if (voter_email && data?.length) {
      externalVoteMap = await fetchVoteMap(
        data.map((r) => r.id),
        voter_email
      );
    }

    const reviews = (data || []).map((r) => {
      const records = getVoteRecords(r);
      const myVote =
        records[voter_email] || externalVoteMap[r.id] || null;
      return {
        ...r,
        my_vote: myVote,
        unhelpful_count: r.unhelpful_count ?? 0,
        media: (r.media_urls || []).map((url) => ({
          url,
          type: url.match(/\.(mp4|mov|webm|avi)$/i)
            ? "video/mp4"
            : "image/jpeg",
        })),
      };
    });

    return res.status(200).json({ reviews });
  }

  // POST：新增評論
  if (req.method === "POST") {
    const { author_name, author_email, author_avatar, rating, title, content, recommend, media_urls } = req.body;

    if (!author_name || !rating || !content) {
      return res.status(400).json({ error: "請填寫必填欄位" });
    }

    const result = await insertWithFallback({
      product_id,
      author_name,
      author_email: author_email || null,
      author_avatar: author_avatar || null,
      rating,
      title,
      content,
      recommend,
      media_urls: media_urls || [],
    });

    if (result.error) return res.status(500).json({ error: result.error.message });
    return res.status(201).json({ review: result.data });
  }

  // PUT：編輯評論
  if (req.method === "PUT") {
    const { id, author_email, rating, title, content, recommend } = req.body;

    if (!id || !author_email) {
      return res.status(400).json({ error: "缺少必要欄位" });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: "找不到評論" });
    }

    if ("author_email" in existing && existing.author_email !== author_email) {
      return res.status(403).json({ error: "無權限編輯此評論" });
    }

    const result = await updateWithFallback(id, {
      rating,
      title,
      content,
      recommend,
      is_edited: true,
      edited_at: new Date().toISOString(),
    });

    if (result.error) return res.status(500).json({ error: result.error.message });
    return res.status(200).json({ review: result.data });
  }

  // PATCH：會員投票（每人每則評論只能投一票，讚／倒讚互斥）
  if (req.method === "PATCH") {
    const { id, action, voter_email } = req.body;

    if (!id || !voter_email) {
      return res.status(400).json({ error: "請先登入會員" });
    }
    if (action !== "up" && action !== "down") {
      return res.status(400).json({ error: "無效的投票類型" });
    }

    const { data: review, error: reviewErr } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (reviewErr || !review) {
      const msg = reviewErr?.message?.includes("0 rows")
        ? "找不到評論"
        : reviewErr?.message || "找不到評論";
      return res.status(404).json({ error: msg });
    }

    let helpful = review.helpful_count || 0;
    let unhelpful = review.unhelpful_count || 0;
    const voteRecords = { ...getVoteRecords(review) };
    const prevVote = voteRecords[voter_email] || null;

    if (prevVote === action) {
      if (action === "up") helpful = Math.max(0, helpful - 1);
      else unhelpful = Math.max(0, unhelpful - 1);
      delete voteRecords[voter_email];

      const countResult = await updateWithFallback(id, {
        helpful_count: helpful,
        unhelpful_count: unhelpful,
        vote_records: voteRecords,
      });

      if (countResult.error) {
        return res.status(500).json({ error: countResult.error.message });
      }

      if (!("vote_records" in (countResult.data || {}))) {
        await supabase
          .from("review_votes")
          .delete()
          .eq("review_id", id)
          .eq("voter_email", voter_email);
      }

      return res.status(200).json({
        helpful_count: helpful,
        unhelpful_count: unhelpful,
        my_vote: null,
      });
    }

    if (prevVote === "up") helpful = Math.max(0, helpful - 1);
    else if (prevVote === "down") unhelpful = Math.max(0, unhelpful - 1);

    if (action === "up") helpful += 1;
    else unhelpful += 1;

    voteRecords[voter_email] = action;

    const countResult = await updateWithFallback(id, {
      helpful_count: helpful,
      unhelpful_count: unhelpful,
      vote_records: voteRecords,
    });

    if (countResult.error) {
      return res.status(500).json({ error: countResult.error.message });
    }

    // 若 vote_records 欄位不存在，改寫入 review_votes 表（若已建立）
    if (!("vote_records" in (countResult.data || {}))) {
      if (prevVote) {
        await supabase
          .from("review_votes")
          .update({ vote_type: action })
          .eq("review_id", id)
          .eq("voter_email", voter_email);
      } else {
        await supabase
          .from("review_votes")
          .insert({ review_id: id, voter_email, vote_type: action });
      }
    }

    return res.status(200).json({
      helpful_count: helpful,
      unhelpful_count: unhelpful,
      my_vote: action,
    });
  }

  // DELETE：管理員刪除評論
  if (req.method === "DELETE") {
    const { id, admin_email } = req.body;

    if (!id || !admin_email) {
      return res.status(400).json({ error: "缺少必要欄位" });
    }

    const ADMIN_EMAILS = (
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      ""
    )
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!ADMIN_EMAILS.includes(admin_email.trim().toLowerCase())) {
      return res.status(403).json({ error: "無管理員權限" });
    }

    const { error: deleteErr } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      return res.status(500).json({ error: deleteErr.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
