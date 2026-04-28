# Vibe Studio

Türkçe AI video üretim stüdyosu. Focal.ai esinli arayüz, Kie.ai entegrasyonu ile çalışır.

---

## Faz 2'de Ne Değişti

**Sürüklenebilir Timeline** — Video, ses ve altyazı 3 ayrı şeritte. Klipleri sürükle-bırak ile sırala, sağ kenardan süreyi ayarla, Kes butonuyla ikiye böl, Sil ile kaldır. Çubuk kırmızı oynatma imleci sürüklenebilir; Oynat tuşu zamanı ilerletir.

**Proje Kaydet/Yükle** — Tüm projeleriniz tarayıcı yerel belleğinde saklanır. Her değişiklik 1 saniye sonra otomatik kaydedilir (üstbarda "Kaydedildi ✓" görünür). Ana sayfada "Yeni Proje" butonu, kartlarda silme. Editörde "JSON İndir / Yükle" ile yedek al, başka makinede aç.

**Gerçek Kie.ai Entegrasyonu** — `KIE_API_KEY` tanımlıysa gerçek API'ya istek atar (video/görsel/ses). Sağ altta "Üretim Paneli" kart — her isin ilerlemesi canlı izlenir. Türkçe hata mesajları. API anahtarı yoksa mock yanıt döner, uygulama yine çalışır.

**Altyazı + Türkçe TTS** — Altyazı tabında "Otomatik Üret" sohbetten cümle çıkartıp zaman çizelgesine ekler. Her satır düzenlenebilir. "SRT İndir" ile standart altyazı dosyası, "Tümünü Seslendir" ile Kie.ai ses modeliyle TTS üretip timeline'a ekler. Video önizlemede oynatma imlecine göre canlı altyazı görünür.

---

## Mac'te Nasıl Çalıştırılır

### 1. Yöntem (Tek Tıkla)

1. ZIP'i masaüstüne çıkarın → `vibe-studio` klasörü oluşur.
2. `baslat.command` dosyasına çift tıklayın.
   - "Geliştirici doğrulanamadı" uyarısı çıkarsa: **Sistem Ayarları → Gizlilik ve Güvenlik → Yine de Aç**.
3. Terminal'de `Local: http://localhost:3000` satırını gördüğünüzde tarayıcıdan açın.

### 2. Yöntem (Manuel)

```bash
cd ~/Desktop/vibe-studio
npm run dev
```

> **Not:** `npm install` gerekmez. Tüm paketler `node_modules` içinde hazır.

### Durdurmak için

Terminal penceresinde **Ctrl + C**.

---

## Kie.ai API Anahtarı

Anahtar olmadan da uygulama çalışır (mock yanıtlar). Gerçek üretim için:

1. [https://kie.ai](https://kie.ai) → kayıt ol.
2. **Settings → API Keys → Create Key**.
3. `vibe-studio` klasöründe `.env.example`'ı kopyalayıp `.env.local` yapın:

   ```
   KIE_API_KEY=sk_kendi_anahtariniz
   PEXELS_API_KEY=
   ```

4. Terminal'de Ctrl+C ile durdurup `npm run dev` ile tekrar başlatın.

---

## Hızlı Kullanım Rehberi

1. **Ana sayfa** — "Yeni Proje" butonu veya son projelerden bir kartı tıklayın.
2. **Promptla başlangıç** — Orta kısımdaki kutuya fikrinizi yazıp "Üret" tıklayın. Sağ altta iş paneli açılır.
3. **Editör** — Sol sekmelerden Sohbet / Medya / Karakter / Altyazı / Ayarlar'a geçin.
4. **Timeline**
   - Klip sürükleyerek sırala.
   - Klibin **sağ kenarındaki küçük sarı çubuğu** çek → süreyi değiştir.
   - **Kes** butonu (makas) → seçili klibi imleç konumundan ikiye böl.
   - **Sil** butonu → seçili klibi çıkar.
   - Boş alana çift tıkla → ilgili şeritte yeni boş klip.
   - **Oynat** → zaman ilerler, video önizlemede altyazı eşzamanlı.
5. **Altyazı tabı**
   - "Sahnelerden Otomatik Üret" — sohbet mesajlarından cümle bazlı altyazı.
   - Her satırın metnini değiştir, sil.
   - "SRT İndir" — dışa aktar.
   - "Tümünü Seslendir" — Türkçe TTS üret.
6. **JSON İndir / Yükle** — üst bardan, yedek alıp paylaşmak için.

---

## Sorun Giderme

**"command not found: npm"** — [https://nodejs.org/tr](https://nodejs.org/tr) LTS kurun.

**Port 3000 kullanımda** — `PORT=3001 npm run dev`

**Üretilen videolar gri** — `KIE_API_KEY` tanımlı değil.

**Altyazı görünmüyor** — Ayarlar tabında "Altyazıları Etkinleştir" açık mı?

**Kaydedilmiş projeler kayboldu** — Tarayıcı çerezlerini temizlediyseniz localStorage da silinir. "JSON İndir" ile düzenli yedek alın.

**Sayfa boş / hata** — Terminal'deki kırmızı satırları Ctrl+C ile durdurup `npm run dev` ile tekrar deneyin.

---

## Klasör Yapısı

```
vibe-studio/
├── app/
│   ├── page.tsx                 Ana sayfa + proje listesi
│   ├── editor/[id]/             Dinamik proje editörü
│   └── api/kie/
│       ├── image/               Kie görsel endpoint
│       ├── video/               Kie video endpoint
│       ├── voice/               Kie TTS endpoint
│       └── poll/                Görev durum polling
├── components/
│   ├── Timeline.tsx             dnd-kit tabanlı zaman çizelgesi
│   ├── TimelineClipItem.tsx     Tek klip (drag/resize)
│   ├── TimelineRuler.tsx        Zaman cetveli + playhead
│   ├── GenerationPanel.tsx      Sağ alt üretim iş paneli
│   ├── JobPollingSubscriber.tsx Kie görev polling sarmalayıcı
│   ├── AutoSaver.tsx            Sessiz otomatik kaydedici
│   ├── SubtitleEditor.tsx       Altyazı düzenleme satırı
│   └── tabs/                    Sol panel sekmeleri
├── lib/
│   ├── store.ts                 Zustand global state + eylemler
│   ├── mocks.ts                 Tipler + örnek veriler
│   ├── kie.ts                   Kie.ai çağrı yardımcıları
│   ├── persistence.ts           localStorage proje yönetimi
│   ├── srt.ts                   SRT/VTT üretici
│   ├── usePolling.ts            Görev durum polling hook
│   └── models.ts                Kie model aileleri
├── node_modules/                Önceden kurulu paketler
├── .env.example
├── package.json
├── baslat.command               Tek tıkla başlatıcı
└── README.md
```

---

Vibe Studio Faz 2: gerçek anlamda kullanılabilir bir mini video stüdyosu.
