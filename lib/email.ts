// Resend ile transactional e-posta gonderimi.
// Kullanim: await sendEmail({ to, template, data })

import { Resend } from "resend";

let _client: Resend | null = null;
function client(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY tanimli degil");
  _client = new Resend(key);
  return _client;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const FROM = process.env.RESEND_FROM || "Vibe Studio <noreply@vibestudio.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://videoone.com.tr";

// === TEMPLATES ===

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #0a0a0b; color: #fafafa; padding: 40px 20px;
`;

function template(title: string, body: string, ctaText?: string, ctaUrl?: string) {
  return `
    <div style="${baseStyle}">
      <div style="max-width: 560px; margin: 0 auto; background: #16171a; border-radius: 16px; padding: 32px; border: 1px solid #2a2b2f;">
        <div style="margin-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(120deg, #fbbf24, #fb7185, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 22px; font-weight: bold;">Vibe Studio</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px; color: #fafafa;">${title}</h1>
        <div style="font-size: 14px; line-height: 1.7; color: #b8b9bd;">${body}</div>
        ${
          ctaText && ctaUrl
            ? `<a href="${ctaUrl}" style="display: inline-block; margin-top: 24px; background: #f59e0b; color: #0a0a0b; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">${ctaText}</a>`
            : ""
        }
        <hr style="border: none; border-top: 1px solid #2a2b2f; margin: 32px 0;">
        <div style="font-size: 11px; color: #5c5d63;">
          Vibe Studio · Türkçe AI video stüdyosu<br>
          <a href="${APP_URL}" style="color: #f59e0b; text-decoration: none;">${APP_URL}</a>
        </div>
      </div>
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  if (!isEmailConfigured()) return;
  const html = template(
    `Hoş geldin${name ? `, ${name}` : ""} 👋`,
    `<p>Vibe Studio'ya kaydolduğun için teşekkürler! Hesabına <strong style="color: #fbbf24;">100 kredi</strong> hediye olarak yatırıldı.</p>
     <p>İlk videonu üretmek için bir konu yaz, AI senaryoyu hazırlasın, sahneleri timeline'a yerleştirsin.</p>`,
    "İlk videonu üret",
    APP_URL
  );
  return client().emails.send({
    from: FROM,
    to,
    subject: "Vibe Studio'ya hoş geldin",
    html,
  });
}

export async function sendSubscriptionConfirmEmail(to: string, plan: string, credits: number) {
  if (!isEmailConfigured()) return;
  const html = template(
    `${plan} planına hoş geldin 🎉`,
    `<p>Aboneliğin başarıyla aktif edildi. <strong style="color: #fbbf24;">${credits.toLocaleString("tr-TR")} kredi</strong> hesabına yatırıldı.</p>
     <p>Premium modeller (Veo 3.1, Sora 2 Pro, Kling 3.0) artık kullanımına açık.</p>`,
    "Pro modelleri dene",
    `${APP_URL}/`
  );
  return client().emails.send({
    from: FROM,
    to,
    subject: `${plan} aboneliği aktif`,
    html,
  });
}

export async function sendGenerationCompleteEmail(
  to: string,
  projectName: string,
  resultUrl: string,
  projectId: string
) {
  if (!isEmailConfigured()) return;
  const html = template(
    `"${projectName}" hazır ✨`,
    `<p>Üretim tamamlandı. Editöre git, klipleri timeline'da gör ve düzenlemeye devam et.</p>`,
    "Editörde aç",
    `${APP_URL}/editor/${projectId}`
  );
  return client().emails.send({
    from: FROM,
    to,
    subject: "Videon hazır",
    html,
  });
}

export async function sendReferralRewardEmail(
  to: string,
  refereeEmail: string,
  creditsAwarded: number
) {
  if (!isEmailConfigured()) return;
  const html = template(
    `Referans ödülün geldi 🎁`,
    `<p><strong>${refereeEmail}</strong> davetinle Vibe Studio'ya katıldı ve abone oldu.</p>
     <p>Hesabına <strong style="color: #fbbf24;">${creditsAwarded.toLocaleString("tr-TR")} kredi</strong> ödül olarak yatırıldı.</p>`,
    "Bakiyeyi gör",
    APP_URL
  );
  return client().emails.send({
    from: FROM,
    to,
    subject: `+${creditsAwarded} kredi ödülün geldi`,
    html,
  });
}
