// ─── Constants ────────────────────────────────────────────────────────────────
export const MAX_CHARS = 1000;

// ─── Helpers ──
export async function api(method, path, body) {
  const opts = { method, credentials: "include", headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error(`Server error (${res.status})`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T" + (timeStr || "00:00"));
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    (timeStr ? " at " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "")
  );
}

export function formatPostedDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    return (
      "Posted " +
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
      " at " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    );
  } catch { return ""; }
}

export function renderStars(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
}

// ─── Dark mode token helper ────
export function dm(dark, darkCls, lightCls) {
  return dark ? darkCls : lightCls;
}
