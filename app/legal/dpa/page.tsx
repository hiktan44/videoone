export const metadata = { title: "Veri İşleme Sözleşmesi (DPA) — Vibe Studio" };

export default function DPA() {
  return (
    <article>
      <h1>Veri İşleme Sözleşmesi (Data Processing Agreement)</h1>
      <p>
        Bu Sözleşme, Vibe Studio'nun ("İşleyen") kullanıcı adına ("Veri Sorumlusu")
        kişisel veri işlediği durumlar için <strong>GDPR Madde 28</strong> ve
        <strong> KVKK Madde 12</strong> uyarınca düzenlenmiştir. B2B müşteriler veya
        kendi son-kullanıcılarını bu platforma getiren kullanıcılar için bağlayıcıdır.
      </p>

      <h2>1. Konu ve Süre</h2>
      <p>
        Veri Sorumlusu, kendi son-kullanıcılarına ait kişisel verileri Vibe Studio
        aracılığıyla işler. Bu Sözleşme, hesap aktif olduğu sürece ve sona erdikten sonra
        veri silme yükümlülüğü tamamlanana kadar yürürlüktedir.
      </p>

      <h2>2. İşleme Detayları</h2>
      <ul>
        <li><strong>Konu:</strong> AI video/görsel/ses üretimi</li>
        <li><strong>Süre:</strong> Hesap süresi + 30 gün silme</li>
        <li><strong>Niteliği:</strong> Saklama, işleme (AI inferans), aktarma (alt-işleyenlere)</li>
        <li><strong>Amacı:</strong> Hizmetin sunulması</li>
        <li><strong>Veri tipleri:</strong> İletişim, içerik (prompt, medya), teknik veriler</li>
        <li><strong>Veri sahipleri:</strong> Veri Sorumlusu'nun son kullanıcıları</li>
      </ul>

      <h2>3. İşleyenin Yükümlülükleri</h2>
      <p>İşleyen olarak Vibe Studio:</p>
      <ul>
        <li>Verileri yalnızca Veri Sorumlusu'nun belgelenmiş talimatları doğrultusunda işler</li>
        <li>Yetkisi olan personelin gizlilik yükümlülüğü altında bulunmasını sağlar</li>
        <li>Madde 32 uyarınca uygun teknik ve organizasyonel güvenlik önlemleri uygular</li>
        <li>Veri sahibi taleplerinin yanıtlanmasında Veri Sorumlusu'na yardımcı olur</li>
        <li>Veri ihlali fark ettikten itibaren <strong>72 saat içinde</strong> Veri Sorumlusu'nu bilgilendirir</li>
        <li>Sözleşme sona erdiğinde verileri silmek veya iade etmek arasında seçim yapma imkânı sunar</li>
        <li>Madde 28 uyarınca denetime tabi olur ve gerekli bilgileri sağlar</li>
      </ul>

      <h2>4. Alt-İşleyenler (Sub-processors)</h2>
      <p>
        Veri Sorumlusu, aşağıdaki alt-işleyenlerin kullanımına genel onay verir.
        Yeni alt-işleyen eklenmesinden 30 gün önce bilgilendirme yapılır; itiraz hakkınız vardır.
      </p>
      <table>
        <thead><tr><th>Alt-İşleyen</th><th>Hizmet</th><th>Konum</th><th>Aktarım Mekanizması</th></tr></thead>
        <tbody>
          <tr><td>Clerk Inc.</td><td>Auth</td><td>ABD</td><td>SCC Modül 3</td></tr>
          <tr><td>Stripe Payments Europe Ltd.</td><td>Ödeme</td><td>İrlanda</td><td>EU içi</td></tr>
          <tr><td>Cloudflare R2</td><td>Depolama</td><td>AB (Frankfurt)</td><td>EU içi</td></tr>
          <tr><td>PostHog Cloud EU</td><td>Analitik</td><td>AB (Frankfurt)</td><td>EU içi</td></tr>
          <tr><td>Resend Inc.</td><td>E-posta</td><td>ABD</td><td>SCC Modül 3</td></tr>
          <tr><td>Kie.ai</td><td>AI üretim</td><td>ABD/Singapur</td><td>SCC + DPA</td></tr>
          <tr><td>Coolify (self-hosted)</td><td>DB / Worker</td><td>Türkiye</td><td>Yurt içi</td></tr>
        </tbody>
      </table>

      <h2>5. Uluslararası Aktarım</h2>
      <p>
        AB dışına aktarımlar, Avrupa Komisyonu Standart Sözleşme Maddeleri
        (2021/914/EU SCC) veya yeterlilik kararı kapsamında gerçekleştirilir.
        Etki değerlendirmesi (TIA) yapılmıştır.
      </p>

      <h2>6. Güvenlik Önlemleri (Madde 32)</h2>
      <ul>
        <li>HTTPS/TLS 1.3 zorunlu, HSTS aktif</li>
        <li>Şifrelerin Clerk üzerinden bcrypt hash ile saklanması</li>
        <li>Veritabanı erişimi rol-based, en-az-yetki prensibi</li>
        <li>Otomatik günlük yedekleme, 30 gün saklama</li>
        <li>R2 bucket'ları varsayılan olarak özel; presigned URL ile geçici erişim</li>
        <li>Düzenli güvenlik güncellemeleri ve dependency taraması</li>
        <li>Ödeme verisi <strong>asla</strong> Vibe Studio sunucularına ulaşmaz (Stripe SAQ-A)</li>
      </ul>

      <h2>7. Veri İhlali Bildirimi</h2>
      <p>
        Bir veri ihlali fark edildiğinde 72 saat içinde
        <a href="mailto:dpo@videoone.com.tr"> dpo@videoone.com.tr</a> üzerinden bildirim yapılır.
        Bildirim ihlalin niteliği, etkilenen veri kategorileri, alınan önlemler ve risk
        değerlendirmesini içerir.
      </p>

      <h2>8. Sözleşme Sonu</h2>
      <p>
        Sözleşme sona erdiğinde, Veri Sorumlusu 30 gün içinde tercihini bildirir:
        verilerin silinmesi veya iade edilmesi. Aksi halde tüm veriler 30 gün sonunda silinir.
        Yasal saklama yükümlülüğü olan veriler bu süreden muaftır.
      </p>

      <h2>9. İmza</h2>
      <p>
        Bu DPA, Hizmeti kullanarak elektronik ortamda kabul edilmiş sayılır. Yazılı versiyon
        için <a href="mailto:dpo@videoone.com.tr">dpo@videoone.com.tr</a> ile irtibata geçin.
      </p>
    </article>
  );
}
