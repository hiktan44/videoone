export const metadata = { title: "İade & Cayma Hakkı — Vibe Studio" };

export default function Refund() {
  return (
    <article>
      <h1>İade ve Cayma Hakkı Politikası</h1>

      <h2>Cayma Hakkı (Türkiye)</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği <strong>m.15(1)(g)</strong> uyarınca,
        elektronik ortamda anında ifa edilen ve maddi olmayan dijital içerik sunan
        hizmetlerde 14 günlük cayma hakkı bulunmamaktadır. Üyelik anında veya
        ilk kredi tüketimi anında bu durum kabul edilmiş sayılır.
      </p>

      <h2>Right of Withdrawal (EU)</h2>
      <p>
        Pursuant to <strong>EU Directive 2011/83 Article 16(m)</strong>, the right of
        withdrawal does not apply to the supply of digital content not provided on a
        tangible medium where performance has begun with the consumer's prior express
        consent. By starting to use credits, you consent to immediate performance and
        acknowledge the loss of withdrawal right.
      </p>

      <h2>Yine de İade Yapabildiğimiz Durumlar</h2>
      <p>Aşağıdaki hallerde, talep tarihinden itibaren 7 iş günü içinde Stripe üzerinden iade gerçekleştirilir:</p>
      <ul>
        <li><strong>Teknik arıza:</strong> Hizmet 24+ saat sürekli erişilemediyse — orantılı kredi/ücret iadesi</li>
        <li><strong>Hatalı tahsilat:</strong> Yanlışlıkla iki kez tahsilat yapıldıysa — tam iade</li>
        <li><strong>Üretim başarısız:</strong> Kredi düşmesine rağmen üretim hatası verdiyse — kredi otomatik iade edilir</li>
        <li><strong>Yeni abone — kullanılmamış kredi:</strong> Üyelikten sonra 7 gün içinde hiç kredi tüketmeden iptal — abonelik tutarı tam iade</li>
      </ul>

      <h2>İade Talebi</h2>
      <p>
        İade talebinizi <a href="mailto:destek@videoone.com.tr">destek@videoone.com.tr</a> adresine,
        kayıtlı e-postanızdan, kullanıcı adı + işlem tarihi + neden bilgileriyle gönderin.
        Yanıt süresi <strong>en fazla 5 iş günü</strong>.
      </p>
      <ul>
        <li>İade onaylanırsa Stripe üzerinden orijinal ödeme yöntemine yapılır.</li>
        <li>Banka tarafına yansıma 5-10 iş günü sürebilir (banka politikasına bağlı).</li>
        <li>Kart komisyonu (Stripe işlem ücreti) Vibe Studio tarafından karşılanır.</li>
      </ul>

      <h2>Abonelik İptali</h2>
      <ul>
        <li>İstediğiniz zaman <code>/settings/billing</code> üzerinden iptal edebilirsiniz.</li>
        <li>İptal sonrası dönem sonuna kadar erişiminiz devam eder; bir sonraki dönem için tahsilat olmaz.</li>
        <li>Kalan krediler dönem sonunda sıfırlanır (devretmez).</li>
      </ul>

      <h2>Ek Kredi Paketleri (Top-up)</h2>
      <p>
        Tek seferlik kredi paketleri kullanılmaya başlandıktan sonra <strong>iade edilemez</strong>.
        Hiç kullanılmamış paketlerin iadesi 14 gün içinde değerlendirilir.
      </p>

      <h2>Tüketici Hakları (Saklı)</h2>
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ile AB Tüketici Mevzuatı kapsamındaki
        haklarınız bu politikadan etkilenmez. Uyuşmazlık halinde Tüketici Hakem Heyeti veya
        Tüketici Mahkemesi'ne başvurabilirsiniz.
      </p>
    </article>
  );
}
