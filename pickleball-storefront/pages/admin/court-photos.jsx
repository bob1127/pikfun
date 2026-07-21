"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ImagePlus, Loader2, MapPin, Search, Trash2 } from "lucide-react";
import { useUser } from "@/components/context/UserContext";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminCourtPhotosPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [courts, setCourts] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace("/login?redirect=/admin/court-photos");
      return;
    }
    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(Boolean(data.isAdmin));
        setChecked(true);
        if (!data.isAdmin) router.replace("/");
      });
  }, [router, userInfo?.email, userLoading]);

  const loadCourts = async () => {
    const res = await fetch("/api/courts/all");
    const data = await res.json();
    setCourts(data.courts || []);
  };

  useEffect(() => {
    if (isAdmin) loadCourts();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return courts;
    return courts.filter((court) =>
      `${court.name} ${court.address} ${court.city}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [courts, query]);

  const upload = async (court, file) => {
    if (!file) return;
    setBusy(court.place_id);
    setMessage("");
    try {
      const fileBase64 = await fileToDataUrl(file);
      const res = await fetch("/api/admin/court-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email: userInfo.email,
          place_id: court.place_id,
          court_name: court.name,
          file_base64: fileBase64,
          file_name: file.name,
          content_type: file.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上傳失敗");
      setMessage(`${court.name}：照片已上傳`);
      await loadCourts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  };

  const remove = async (court, url) => {
    if (!window.confirm("確定要從這個球場移除照片嗎？")) return;
    setBusy(court.place_id);
    setMessage("");
    try {
      const res = await fetch("/api/admin/court-photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email: userInfo.email,
          place_id: court.place_id,
          court_name: court.name,
          remove_url: url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "移除失敗");
      await loadCourts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  };

  if (userLoading || !checked || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center pt-24 text-sm text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={18} />
        載入中…
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>球場實拍照片｜PikFun Admin</title>
      </Head>
      <main className="min-h-screen bg-[#f5f8fb] pb-20 pt-28">
        <div className="mx-auto max-w-[1050px] px-5 md:px-8">
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-black tracking-[0.2em] text-[#005caf]">
              COURT PHOTOS
            </p>
            <h1 className="text-2xl font-black">球場實拍照片</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              圖片會存入 Cloudflare R2；沒有實拍照時，前端使用 OSM
              地圖與品牌占位畫面，不會呼叫 Google Place Photo。
            </p>
          </div>

          <label className="mb-6 flex h-12 items-center gap-3 border border-gray-200 bg-white px-4">
            <Search size={17} className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋球場、縣市或地址"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>

          {message && (
            <div className="mb-5 border border-[#005caf]/20 bg-white px-4 py-3 text-sm text-[#005caf]">
              {message}
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((court) => {
              const photos = Array.isArray(court.custom_photos)
                ? court.custom_photos
                : [];
              return (
                <article
                  key={court.place_id || court.id}
                  className="border border-gray-200 bg-white p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-black">
                        {court.name}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin size={12} />
                        {court.city} {court.address}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {photos.map((url) => (
                        <div
                          key={url}
                          className="group relative h-16 w-20 overflow-hidden border border-gray-200"
                        >
                          <img
                            src={url}
                            alt={court.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => remove(court, url)}
                            className="absolute right-1 top-1 bg-black/65 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="移除照片"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <label
                      className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-[#005caf] px-4 text-xs font-bold text-[#005caf] ${
                        busy === court.place_id || photos.length >= 6
                          ? "pointer-events-none opacity-50"
                          : "hover:bg-[#eef5fb]"
                      }`}
                    >
                      {busy === court.place_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ImagePlus size={14} />
                      )}
                      {photos.length ? `${photos.length}/6` : "上傳實拍"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          upload(court, event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
