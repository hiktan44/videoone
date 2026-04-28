import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KIE_UPLOAD_BASE = "https://kieai.redpandaai.co";

// Kullanicinin yapistirdigi bir public URL'yi Kie'nin file-url-upload endpoint'ine yonlendirir.
// Kie, URL'yi kendi sunucusuna kopyalar ve tempfile.redpandaai.co uzerinden 3 gun tempo calisir.
// Bu, orijinal URL'si kisa suren (imgur, sosyal medya CDN) veya CORS sikintili olan
// kaynaklar icin tavsiye edilir.
export async function POST(req: Request) {
  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "KIE_API_KEY tanımlı değil." },
      { status: 400 }
    );
  }

  let body: { fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const fileUrl = (body.fileUrl || "").trim();
  if (!/^https?:\/\//i.test(fileUrl)) {
    return NextResponse.json({ error: "Geçerli bir http/https URL giriniz." }, { status: 400 });
  }

  try {
    const res = await fetch(`${KIE_UPLOAD_BASE}/api/file-url-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileUrl,
        uploadPath: "vibe-studio/uploads",
      }),
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.msg || `URL yüklemesi başarısız (HTTP ${res.status}).`, detail: data },
        { status: 502 }
      );
    }

    const info = data?.data ?? data;
    const url: string | undefined = info?.downloadUrl || info?.fileUrl || info?.url;
    if (!url) {
      return NextResponse.json(
        { error: "Yanıtta downloadUrl bulunamadı.", raw: data },
        { status: 502 }
      );
    }
    return NextResponse.json({
      url,
      fileName: info?.fileName,
      mimeType: info?.mimeType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: `Kie'ye bağlanılamadı: ${msg}` }, { status: 502 });
  }
}
