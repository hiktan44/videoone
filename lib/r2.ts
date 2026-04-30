// Cloudflare R2 (S3 uyumlu) helper'lari.
// Asset upload + presigned URL'ler.

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET || "vibe-studio-assets";
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

// Lazy init: R2 ortam degiskenleri yoksa client null doner ve uploadlar atlanir.
let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 ortam degiskenleri eksik (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export function isConfigured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey);
}

/** Public URL'i hesaplar. R2_PUBLIC_URL set edilmemisse null doner. */
export function publicUrlFor(key: string): string | null {
  if (!publicUrl) return null;
  return `${publicUrl}/${key}`;
}

/** Direkt server tarafindan yukleme (kucuk dosyalar icin). */
export async function uploadObject(
  key: string,
  body: Uint8Array | Buffer | Blob,
  contentType: string
): Promise<{ key: string; url: string | null }> {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body as any,
      ContentType: contentType,
    })
  );
  return { key, url: publicUrlFor(key) };
}

/** Tarayicidan direkt R2'ye yukleme icin presigned PUT URL. 15 dakika gecerli. */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<{ uploadUrl: string; key: string; publicUrl: string | null }> {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn });
  return { uploadUrl, key, publicUrl: publicUrlFor(key) };
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function headObject(key: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
  try {
    const res = await client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { exists: true, size: res.ContentLength ?? undefined, contentType: res.ContentType ?? undefined };
  } catch {
    return { exists: false };
  }
}

/** Bir Kie.ai (veya baska) URL'sini indirip R2'ye kopyalar. Asset kalici hale gelir. */
export async function copyFromUrl(
  sourceUrl: string,
  key: string
): Promise<{ key: string; url: string | null; sizeBytes: number; contentType: string }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Kaynak indirilemedi: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  await uploadObject(key, buf, contentType);
  return { key, url: publicUrlFor(key), sizeBytes: buf.length, contentType };
}

/** Object key uretimi: user/<userId>/<kind>/<timestamp>-<random>.<ext> */
export function buildKey(userId: string, kind: string, ext: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const safeExt = ext.replace(/^\./, "").replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `user/${userId}/${kind}/${ts}-${rand}.${safeExt}`;
}
