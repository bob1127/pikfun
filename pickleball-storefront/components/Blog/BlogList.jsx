import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatWpDate, mapPostToBase, stripHtml } from "@/lib/wordpress";

function tagClass(categoryKey) {
  if (categoryKey === "active") return "editorial-tag editorial-tag--active";
  if (categoryKey === "knowledge") return "editorial-tag editorial-tag--knowledge";
  return "editorial-tag editorial-tag--default";
}

export default function BlogList({
  posts,
  categoryKey,
  categoryLabel,
  listBackHref = "/",
  listBackLabel = "返回首頁",
  showFooter = true,
}) {
  return (
    <>
      <ul className="editorial-list">
        {posts.map((post) => {
          const base = post._mapped || mapPostToBase(post);
          const slug = base.slug;
          const title =
            base.title || stripHtml(post.title?.rendered || "");
          const date = base.dateFormatted || formatWpDate(post.date);
          const tag = base.categories?.[0] || categoryLabel || "文章";

          return (
            <li key={post.id} className="editorial-list-item">
              <Link
                href={`/blog/${slug}`}
                className="editorial-list-link"
              >
                <span className={tagClass(categoryKey)}>{tag}</span>
                <span className="editorial-list-date">{date}</span>
                <span className="editorial-list-title">{title}</span>
                <span className="editorial-list-arrow" aria-hidden>
                  <ChevronRight size={16} strokeWidth={2.5} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {posts.length === 0 && (
        <p className="text-center text-[var(--color-text-muted)] py-12">
          此分類尚無文章。
        </p>
      )}

      {showFooter && (
        <div className="editorial-list-footer">
          <Link href={listBackHref} className="editorial-cta-link">
            {listBackLabel}
            <span className="editorial-list-arrow" aria-hidden>
              <ChevronRight size={16} strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
