import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Next.js App Router: multipart gövdesini olduğu gibi almak için bodyParser kapatmaya gerek yok,
// Request.formData() standart çalışır.

const KIE_UPLOAD_BASE = "https://kieai.redpandaai.co";

// Kullanici tarafindan secilen dosyayi Kie'nin file-stream-upload endpoint'ine yonlendirir.
// Kie, dosyayi gecici olarak 3 gun saklar ve public downloadUrl doner — bu URL'yi
// ardindan kie.ts'deki createTask akisinda image_urls[] icinde kullanacagiz.
export async function POST(req: Request) {
  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "KIE_API_KEY tanımlı değil. .env.local dosyanızı kontrol edin." },
      { status: 400 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch (e) {
    return NextResponse.json(
      { error: "Dosya alınamadı (multipart gövdesi okunamadı)." },
      { status: 400 }
    );
  }

  const file = incoming.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Yüklenecek 'file' alanı gerekli." },
      { status: 400 }
    );
  }

  // 30 MB uzerini reddet (Kie 100 MB desteklese de hizli gonderim icin)
  if (file.size > 30 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Dosya 30 MB sınırını aşıyor." },
      { status: 413 }
    );
  }

  // Kie'ye yonlendirilecek yeni FormData
  const forward = new FormData();
  forward.set("file", file, file.name || "upload.bin");
  forward.set("uploadPath", "vibe-studio/uploads");
  // Benzersiz dosya adi: orijinal + timestamp
  const fname = file.name ? file.name.replace(/[^\w.\-]+/g, "_") : "upload.bin";
  forward.set("fileName", `${Date.now()}_${fname}`);

  try {
    const res = await fetch(`${KIE_UPLOAD_BASE}/api/file-stream-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` },
      body: forward,
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      const msg =
        res.status === 401 ? "API anahtarı geçersiz."
        : res.status === 413 ? "Dosya boyutu Kie sınırını aşıyor."
        : res.status === 429 ? "Çok fazla yükleme isteği. Birkaç saniye bekleyin."
        : res.status >= 500 ? "Kie.ai sunucu hatası."
        : data?.msg || `Yükleme başarısız (HTTP ${res.status}).`;
      return NextResponse.json({ error: msg, detail: data }, { status: 502 });
    }

    const info = data?.data ?? data;
    const url: string | undefined =
      info?.downloadUrl || info?.fileUrl || info?.url;

    if (!url) {
      return NextResponse.json(
        { error: "Yükleme yanıtında URL bulunamadı.", raw: data },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url,
      fileName: info?.fileName,
      mimeType: info?.mimeType,
      fileSize: info?.fileSize,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen ağ hatası";
    return NextResponse.json(
      { error: `Kie'ye bağlanılamadı: ${msg}` },
      { status: 502 }
    );
  }
}
