// Pexels API helper'lari (https://www.pexels.com/api/documentation/)

const BASE = "https://api.pexels.com";

function authHeaders() {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY tanimli degil");
  return { Authorization: key };
}

export type PexelsImage = {
  id: number;
  url: string; // pexels page
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
  alt: string;
  photographer: string;
  photographer_url: string;
};

export type PexelsVideo = {
  id: number;
  url: string;
  image: string; // poster thumbnail
  duration: number; // seconds
  user: { name: string; url: string };
  video_files: Array<{
    id: number;
    quality: string; // "hd" | "sd" | "hls"
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
};

export async function searchImages(query: string, perPage = 24, page = 1) {
  const url = `${BASE}/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Pexels images ${res.status}`);
  const data = (await res.json()) as { photos: PexelsImage[]; total_results: number };
  return { items: data.photos, total: data.total_results };
}

export async function searchVideos(query: string, perPage = 24, page = 1) {
  const url = `${BASE}/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Pexels videos ${res.status}`);
  const data = (await res.json()) as { videos: PexelsVideo[]; total_results: number };
  return { items: data.videos, total: data.total_results };
}

/** Bir Pexels videosundan timeline'a uygun kalitede dosya secer (1080p tercih, yoksa hd, yoksa ilk dosya) */
export function pickBestVideoFile(v: PexelsVideo): { url: string; width: number; height: number } | null {
  const files = v.video_files.filter((f) => f.file_type === "video/mp4");
  if (files.length === 0) return null;
  // 1080p mp4 tercih
  const p1080 = files.find((f) => f.height === 1080);
  if (p1080) return { url: p1080.link, width: p1080.width, height: p1080.height };
  const hd = files.find((f) => f.quality === "hd");
  if (hd) return { url: hd.link, width: hd.width, height: hd.height };
  return { url: files[0].link, width: files[0].width, height: files[0].height };
}
