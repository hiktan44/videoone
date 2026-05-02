export const metadata = { title: "Çerez Politikası — Vibe Studio" };

export default function Cookies() {
  return (
    <article>
      <h1>Çerez Politikası</h1>

      <h2>Çerez Nedir?</h2>
      <p>
        Çerez (cookie), web sitesinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır.
        Oturumun korunması, tercihlerinizin hatırlanması ve site kullanımının ölçülmesi için kullanılır.
      </p>

      <h2>Kullandığımız Çerezler</h2>
      <table>
        <thead>
          <tr>
            <th>Ad</th><th>Tip</th><th>Süre</th><th>Amaç</th><th>Hukuki Sebep</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>__session, __clerk_*</td><td>Zorunlu</td><td>Oturum / 7 gün</td>
            <td>Clerk kimlik doğrulama</td><td>Sözleşmenin ifası</td>
          </tr>
          <tr>
            <td>vibe_ref</td><td>Fonksiyonel</td><td>30 gün</td>
            <td>Tavsiye kodu hatırlama</td><td>Meşru menfaat</td>
          </tr>
          <tr>
            <td>vibe_locale</td><td>Fonksiyonel</td><td>1 yıl</td>
            <td>Dil tercihi</td><td>Meşru menfaat</td>
          </tr>
          <tr>
            <td>vibe_theme</td><td>Fonksiyonel</td><td>1 yıl</td>
            <td>Açık/koyu tema tercihi</td><td>Meşru menfaat</td>
          </tr>
          <tr>
            <td>ph_*</td><td>Analitik</td><td>1 yıl</td>
            <td>PostHog anonim ürün analitiği</td><td>Açık rıza</td>
          </tr>
          <tr>
            <td>__stripe_mid, __stripe_sid</td><td>Zorunlu (ödeme)</td><td>1 yıl / 30 dk</td>
            <td>Stripe sahtekarlık önleme</td><td>Sözleşmenin ifası</td>
          </tr>
        </tbody>
      </table>

      <h2>Üçüncü Taraf Çerezleri</h2>
      <ul>
        <li><strong>Clerk</strong> (clerk.com) — kimlik doğrulama (zorunlu)</li>
        <li><strong>Stripe</strong> (stripe.com) — ödeme işleme (zorunlu)</li>
        <li><strong>PostHog</strong> (eu.posthog.com) — analitik (rıza ile)</li>
      </ul>

      <h2>Çerezleri Nasıl Yönetirsiniz?</h2>
      <p>
        Tarayıcı ayarlarınızdan çerezleri silebilir, engelleyebilir veya her çerez talebinde
        uyarı alabilirsiniz. Zorunlu çerezler engellendiğinde Hizmet doğru çalışmaz.
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Chrome</a></li>
        <li><a href="https://support.mozilla.org/tr/kb/cerezler-bilgi-web-siteleri-bilgisayarinizda-depo" target="_blank" rel="noreferrer">Firefox</a></li>
        <li><a href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/tr-tr/microsoft-edge" target="_blank" rel="noreferrer">Edge</a></li>
      </ul>

      <h2>Çerez Onayı</h2>
      <p>
        Hizmete ilk girişinizde gösterilen çerez banner'ından "Yalnızca zorunlu" veya "Tümünü kabul et"
        seçeneklerini kullanabilirsiniz. Tercihinizi her zaman ayarlardan değiştirebilirsiniz.
      </p>

      <h2>Hukuki Dayanak</h2>
      <p>
        Bu politika, KVKK, ePrivacy Direktifi (2002/58/EC) ve GDPR çerçevesinde hazırlanmıştır.
        Türkiye için BTK Çerez ve Aydınlatma Tebliği uyarınca açık rıza gereken çerezler
        ayrıca bildirilmiştir.
      </p>
    </article>
  );
}
