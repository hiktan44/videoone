export const metadata = { title: "GDPR Information — Vibe Studio" };

export default function GDPR() {
  return (
    <article>
      <h1>GDPR Information Notice</h1>
      <p>
        This page summarises how Vibe Studio (<em>videoone.com.tr</em>) processes personal data
        of users in the European Economic Area (EEA) under <strong>Regulation (EU) 2016/679 (GDPR)</strong>.
        For the full Privacy Policy, see <a href="/legal/privacy">/legal/privacy</a>.
      </p>

      <h2>1. Controller</h2>
      <p>
        Vibe Studio (sole proprietorship, Türkiye) — Contact: <a href="mailto:dpo@videoone.com.tr">dpo@videoone.com.tr</a>
      </p>
      <p>
        <strong>EU Representative (Art. 27):</strong> Not appointed at this time, as the controller
        does not have an establishment in the EU and processing is not on a large scale of special
        categories. Will be appointed if user-base in the EU exceeds material threshold.
      </p>

      <h2>2. Categories of Personal Data</h2>
      <ul>
        <li>Identity: name, username</li>
        <li>Contact: email address</li>
        <li>Account / billing: plan, payment amount, invoice metadata, credit ledger</li>
        <li>Technical: IP address, device, browser, session logs</li>
        <li>Content: prompts, uploaded media, generated outputs</li>
        <li>Analytics (anonymised/aggregated): page views, feature usage</li>
      </ul>

      <h2>3. Lawful Basis (Art. 6)</h2>
      <ul>
        <li><strong>(b) Contract performance:</strong> service provision, account management, generation</li>
        <li><strong>(c) Legal obligation:</strong> tax, billing records (Turkish VUK §253-256 — 10-year retention)</li>
        <li><strong>(f) Legitimate interest:</strong> security logging, fraud prevention, abuse detection</li>
        <li><strong>(a) Consent:</strong> marketing emails, non-essential cookies, analytics</li>
      </ul>

      <h2>4. International Transfers</h2>
      <p>Personal data may be transferred outside the EEA to:</p>
      <ul>
        <li><strong>Clerk Inc. (USA)</strong> — authentication. Safeguard: Standard Contractual Clauses (Module 2).</li>
        <li><strong>Resend Inc. (USA)</strong> — transactional email. Safeguard: SCC.</li>
        <li><strong>Kie.ai (USA / Singapore)</strong> — AI generation. Safeguard: SCC + DPA.</li>
        <li><strong>Cloudflare R2 (EU region — Frankfurt)</strong> — storage. EU-only, no transfer.</li>
        <li><strong>Stripe Payments Europe Ltd. (Ireland)</strong> — payments. EU-only.</li>
        <li><strong>PostHog (EU cloud — Frankfurt)</strong> — analytics. EU-only.</li>
      </ul>

      <h2>5. Retention</h2>
      <ul>
        <li>Account data: while account is active</li>
        <li>After deletion: 30 days for full erasure</li>
        <li>Billing/tax records: 10 years (Turkish tax code requirement — anonymised)</li>
        <li>Security logs: 90 days</li>
        <li>Marketing data: until consent withdrawn</li>
      </ul>

      <h2>6. Your Rights (Art. 15-22)</h2>
      <ul>
        <li><strong>Access (Art. 15):</strong> request a copy of your personal data</li>
        <li><strong>Rectification (Art. 16):</strong> correct inaccurate data</li>
        <li><strong>Erasure / Right to be forgotten (Art. 17):</strong> delete your account</li>
        <li><strong>Restriction (Art. 18):</strong> limit processing</li>
        <li><strong>Data portability (Art. 20):</strong> receive your data in a machine-readable format</li>
        <li><strong>Object (Art. 21):</strong> oppose processing based on legitimate interest</li>
        <li><strong>Not subject to automated decision-making (Art. 22):</strong> we do not make solely automated decisions with legal effect</li>
        <li><strong>Withdraw consent (Art. 7(3)):</strong> at any time, without affecting prior lawful processing</li>
      </ul>
      <p>
        Exercise these rights at <a href="/settings/privacy">/settings/privacy</a> or by emailing
        <a href="mailto:dpo@videoone.com.tr"> dpo@videoone.com.tr</a>. We respond within
        <strong> 30 days</strong> (extendable by 60 days for complex requests).
      </p>

      <h2>7. Right to Lodge a Complaint (Art. 77)</h2>
      <p>
        You may lodge a complaint with your national data protection authority
        (e.g. <a href="https://www.cnil.fr">CNIL</a> in France, <a href="https://www.bfdi.bund.de">BfDI</a> in Germany,
        <a href="https://www.aepd.es">AEPD</a> in Spain, <a href="https://www.garanteprivacy.it">Garante</a> in Italy,
        <a href="https://ico.org.uk">ICO</a> in the UK).
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not intended for individuals under <strong>16</strong> years of age. We do
        not knowingly collect personal data from children. If you become aware that a child has
        provided us with personal data, contact us and we will delete it.
      </p>

      <h2>9. Data Protection Officer (DPO)</h2>
      <p>
        Although a DPO is not strictly required under Art. 37, we have designated a contact for
        all data protection matters: <a href="mailto:dpo@videoone.com.tr">dpo@videoone.com.tr</a>.
      </p>

      <h2>10. Changes</h2>
      <p>
        Material changes to this notice will be communicated by email at least 14 days before
        they take effect.
      </p>
    </article>
  );
}
