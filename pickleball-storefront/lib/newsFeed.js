import { fetchNewsPosts, mapPostToNewsCard } from "@/lib/wordpress";
import {
  fetchApprovedCommunityPosts,
  mapCommunityPostToNewsCard,
} from "@/lib/communityPosts";

/** 合併 WordPress 官方文章 + 社群投稿（教練／球場主／活動主揪），依日期排序 */
export async function fetchMergedNewsFeed({ perPage = 24 } = {}) {
  const [wpPosts, communityPosts] = await Promise.all([
    fetchNewsPosts({ perPage }).catch(() => []),
    fetchApprovedCommunityPosts({ limit: perPage }).catch(() => []),
  ]);

  const wpCards = wpPosts.map(mapPostToNewsCard);
  const communityCards = communityPosts.map(mapCommunityPostToNewsCard);

  return [...wpCards, ...communityCards].sort((a, b) => {
    const dateA = a.rawDate ? new Date(a.rawDate).getTime() : new Date(a.date).getTime();
    const dateB = b.rawDate ? new Date(b.rawDate).getTime() : new Date(b.date).getTime();
    return dateB - dateA;
  });
}
