export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 地標圓形標記用：優先發起人頭像，其次場地名稱首字 */
export function getGroupMarkerMeta(group, { fallbackLabel = "Court", fallbackInitial = "P" } = {}) {
  const sessions = [...(group?.sessions || [])].sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  );
  const primary = sessions[0] || {};
  const withAvatar = sessions.find((s) => s.host_avatar);
  const avatar = withAvatar?.host_avatar || primary.host_avatar || null;
  const label = group?.location_name || primary.host_name || fallbackLabel;
  const initial = label.trim().charAt(0) || fallbackInitial;
  const count = sessions.length;
  const multi = count > 1;

  return { avatar, initial, label, count, multi, primary };
}

export function buildCircleMarkerHtml(meta, { active = false } = {}) {
  const border = meta.multi ? "#ef4023" : "#005caf";
  const ring = active ? "#c8f542" : "#ffffff";
  const safeAvatar = meta.avatar ? escapeHtml(meta.avatar) : "";
  const safeInitial = escapeHtml(meta.initial);

  const inner = meta.avatar
    ? `<img src="${safeAvatar}" alt="" class="psm-circle-img" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.querySelector('.psm-circle-fallback').style.display='flex';" />`
    : "";

  const fallbackStyle = meta.avatar ? "display:none" : "display:flex";

  return `<div class="psm-circle-wrap${active ? " is-active" : ""}">
    <div class="psm-circle" style="border-color:${border};box-shadow:0 0 0 3px ${ring}, 0 8px 20px rgba(15,23,42,0.22)">
      ${inner}
      <span class="psm-circle-fallback" style="${fallbackStyle}">${safeInitial}</span>
    </div>
    ${
      meta.multi
        ? `<span class="psm-circle-badge" style="background:${border}">${meta.count}</span>`
        : ""
    }
    <span class="psm-circle-pointer" style="border-top-color:${border}"></span>
  </div>`;
}
