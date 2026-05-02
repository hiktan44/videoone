export const metadata = { title: "Gizlilik Politikası — Vibe Studio" };

export default function PrivacyPolicy() {
  return (
    <article>
      <h1>Gizlilik Politikası</h1>
      <p><strong>Yürürlük:</strong> 1 Ocak 2025 — Son güncelleme: 2 Mayıs 2026</p>

      <p>
        Vibe Studio (videoone.com.tr — bundan sonra <strong>"Hizmet"</strong>) olarak,
        kişisel verilerinizin gizliliğini ciddiye alıyoruz. Bu politika, hangi verileri
        topladığımızı, neden topladığımızı, nasıl kullandığımızı, kimlerle paylaştığımızı
        ve haklarınızı açıklar. <strong>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong> ve
        <strong> AB Genel Veri Koruma Tüzüğü (GDPR — Regulation 2016/679)</strong> kapsamında düzenlenmiştir.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <ul>
        <li><strong>Tüzel kişi:</strong> Vibe Studio (Bireysel girişim — Türkiye)</li>
        <li><strong>İletişim:</strong> <a href="mailto:kvkk@videoone.com.tr">kvkk@videoone.com.tr</a></li>
        <li><strong>Veri koruma sorumlusu (DPO):</strong> <a href="mailto:dpo@videoone.com.tr">dpo@videoone.com.tr</a></li>
        <li><strong>AB Temsilcisi (GDPR Madde 27):</strong> Atanmamıştır — şu an EU içinde sabit kullanıcı tabanı/işyeri yoktur.
          AB kullanıcıları haklarını doğrudan yukarıdaki adres üzerinden kullanabilir.</li>
      </ul>

      <h2>2. İşlenen Kişisel Veriler</h2>
      <table>
        <thead><tr><th>Kategori</th><th>Veri</th><th>Kaynak</th></tr></thead>
        <tbody>
          <tr><td>Kimlik</td><td>Ad, soyad, kullanıcı adı</td><td>Clerk üyelik</td></tr>
          <tr><td>İletişim</td><td>E-posta</td><td>Clerk üyelik</td></tr>
          <tr><td>Müşteri işlem</td><td>Ödeme tutarı, plan, fatura no, kredi hareketleri</td><td>Stripe + DB</td></tr>
          <tr><td>İşlem güvenliği</td><td>IP, tarayıcı, cihaz, oturum logları</td><td>Otomatik</td></tr>
          <tr><td>Pazarlama / analiz</td><td>Sayfa görüntüleme, tıklama, özellik kullanım</td><td>PostHog (anonim/agg)</td></tr>
          <tr><td>İçerik (kullanıcı tarafından yüklenen)</td><td>Prompt, ses, görsel, video</td><td>Kullanıcı</td></tr>
          <tr><td>Üretilen içerik</td><td>AI çıktıları (mp4, png, mp3)</td><td>Otomatik — AI sağlayıcı</td></tr>
        </tbody>
      </table>

      <h2>3. İşleme Amaçları ve Hukuki Sebepler</h2>
      <ul>
        <li><strong>Hizmetin sunulması</strong> — sözleşmenin ifası (KVKK m.5/2-c, GDPR Art.6(1)(b))</li>
        <li><strong>Faturalama, vergi yükümlülüğü</strong> — yasal zorunluluk (KVKK m.5/2-ç, GDPR Art.6(1)(c)) — VUK madde 253-256, 10 yıl saklama</li>
        <li><strong>Güvenlik logları</strong> — meşru menfaat (KVKK m.5/2-f, GDPR Art.6(1)(f)) — 90 gün</li>
        <li><strong>Pazarlama iletişimi</strong> — açık rıza (KVKK m.5/1, GDPR Art.6(1)(a)) — istediğiniz zaman geri çekebilirsiniz</li>
        <li><strong>Çerez/analitik</strong> — açık rıza (banner üzerinden)</li>
      </ul>

      <h2>4. Verilerin Aktarıldığı Üçüncü Taraflar (İşleyenler)</h2>
      <ul>
        <li><strong>Clerk Inc.</strong> (ABD) — kimlik doğrulama. Standart Sözleşme Maddeleri (SCC) kapsamında.</li>
        <li><strong>Stripe Payments Europe Ltd.</strong> (İrlanda) — ödeme işleme. AB içi.</li>
        <li><strong>Cloudflare R2</strong> (AB EU west) — medya depolama. AB içi.</li>
        <li><strong>Coolify self-hosted PostgreSQL</strong> (Türkiye/AB veri merkezi) — birincil veritabanı.</li>
        <li><strong>Resend Inc.</strong> (ABD) — transactional e-posta. SCC kapsamında.</li>
        <li><strong>PostHog</strong> (AB cloud — Frankfurt) — anonim ürün analitiği. AB içi.</li>
        <li><strong>Kie.ai</strong> (ABD/Singapur) — AI üretim sağlayıcısı. <strong>Promptlarınız ve referans dosyalarınız bu sağlayıcıya iletilir.</strong> Çıktılar üretildikten sonra sağlayıcıdan silinir (14 gün içinde).</li>
      </ul>

      <h2>5. Saklama Süreleri</h2>
      <ul>
        <li>Hesap aktif olduğu sürece — kullanıcı içerikleri ve profil verileri</li>
        <li>Hesap silindiğinde — 30 gün içinde tüm içerik silinir</li>
        <li>Faturalar / vergi belgeleri — 10 yıl (VUK m.253-256)</li>
        <li>Güvenlik logları — 90 gün</li>
        <li>Pazarlama iletişim verisi — rıza geri çekilene kadar</li>
      </ul>

      <h2>6. Haklarınız (KVKK m.11 / GDPR Art.15-22)</h2>
      <ul>
        <li>İşlenen verileriniz hakkında bilgi alma</li>
        <li>İşleme amacını öğrenme</li>
        <li>Düzeltme talep etme</li>
        <li>Silme talep etme (unutulma hakkı)</li>
        <li>İşlemenin sınırlandırılmasını talep etme</li>
        <li>Veri taşınabilirliği (verilerinizin makine-okunabilir kopyası)</li>
        <li>Otomatik karar vermeye itiraz</li>
        <li>Açık rızayı geri çekme</li>
        <li>Veri koruma otoritesine şikayet (KVKK / EDPB)</li>
      </ul>
      <p>
        Bu hakları <a href="/settings/privacy">/settings/privacy</a> sayfasından kullanabilirsiniz —
        verilerinizi tek tıkla indirebilir veya hesabınızı silebilirsiniz. Yazılı talep için
        <a href="mailto:kvkk@videoone.com.tr"> kvkk@videoone.com.tr</a>.
      </p>

      <h2>7. Çocukların Verileri</h2>
      <p>
        Hizmet 16 yaş altı kullanıcılara yönelik değildir. Bu yaştan küçük kullanıcıların
        veri girdiğini fark edersek hesap derhal silinir.
      </p>

      <h2>8. Politika Değişiklikleri</h2>
      <p>
        Bu politika güncellendiğinde, e-posta ile bilgilendirilirsiniz. Değişiklik tarihi
        her zaman bu sayfanın üstünde görünür.
      </p>
    </article>
  );
}
