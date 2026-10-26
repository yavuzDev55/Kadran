# Kadran — Tasarım ve Uygulama Paketi

Bu paket, Kadran (Node/Express/Prisma backend + React/Vite/Tailwind frontend) için tasarlanmış arayüzü başka bir yapay zekâya ya da geliştiriciye aktarmak için hazırlandı.

## İçerik
| Dosya | Ne işe yarar |
|---|---|
| `design-reference.html` | Tam çalışan referans. Tarayıcıda açıp her ekranı görebilirsin (Dashboard, Calendar, Tasks, New task, Settings, Sign in / Register). Veri sahte, tarayıcıda tutulur. |
| `src/styles.css` | Tüm görünüm: renk/font token'ları (`:root` ve koyu tema), bileşenler, doku arka planları (kağıt tanesi, mantar pano, kategori desenleri). |
| `src/body.html` | Sayfaların HTML iskeleti (her sayfa `<main>` bloğu). |
| `src/app.js` | Tüm davranış: veri modeli, takvim yerleşimi, sürükleyerek görev oluşturma, form, saat kadranı, filtreler, giriş/kayıt. |
| `src/index-head.html` | Font bağlantıları ve başlık. |

## Yapay zekâya verilecek istem

> Kadran projesini bu referans tasarıma göre React 19 + Vite + Tailwind 3.4 ile uygula.
> Referans dosyalar: `design-reference.html` (görsel hedef), `src/styles.css` (token'lar ve bileşen stilleri), `src/body.html` (yapı), `src/app.js` (davranış).
>
> Kurallar:
> 1. Önce `styles.css` içindeki `:root` renk ve font token'larını `tailwind.config.js` içine taşı. Yazı tipleri: Young Serif (başlık), Syne (sadece sayılar, küçük boyutta), Inter (arayüz). Koyu tema `[data-theme="dark"]` ile.
> 2. Bileşenleri küçük adımlarla kur, sırayla: token → Button, Segmented, Chip, Switch → TaskRow / TaskCard → Calendar (haftalık ve aylık) → Dashboard → Tasks → New task formu → Settings → Auth.
> 3. Tüm arayüz metni İngilizce kalsın. Kısa metin, sade görünüm. Süslü gösterge ve gölge kullanma.
> 4. Görev türü ve renk değerlerini backend'deki `colors.js` ve frontend'deki `taskRules.js` ile senkron tut. Repodaki `AGENTS.md` dosyasını önce oku ve onu uygula.
> 5. Şu alanlar veritabanında yoksa Prisma şemasına ekle ve migrasyon yaz: `kind` (timed | open | deadline | allday | anytime), `tags` (etiket listesi), `pinned`, `done`, `allDay` bitiş tarihi (`d2`). `anytime` görevleri takvimde gösterilmez. API sözleşmesini mümkün olduğunca koru; değişiklikleri README'ye yaz.
> 6. Doku arka planlarını (kağıt tanesi, mantar pano, kategori desenleri) ortak bir CSS sınıfında tut, her bileşende tekrar etme.
> 7. Her adımdan sonra 1440, 1024 ve 390 px genişliklerde kontrol et, sayfa yatay kaymamalı.
> 8. Bitirince neyi yaptığını, neyi atladığını ve neyin backend gerektirdiğini raporla.

## Görev veri modeli (referans)
```
{ id, title, type: course|exam|homework|custom,
  kind: timed|open|deadline|allday|anytime,
  d (gün, anytime için yok), d2 (allday aralık bitişi, isteğe bağlı),
  s, e (dakika cinsinden; timed için başlangıç/bitiş, open/deadline için s),
  pri: high|med|low, color (isteğe bağlı, yoksa tür rengi),
  desc, tags[], pinned, done }
```

## Tasarım kuralları (değiştirme)
- Açık tema öncelikli; kırık, düşük doygunluklu renkler. Tür rengi sadece arka plan tonu ve desen olarak görünür, yazı her zaman koyu kalır.
- Öncelik: düşük = kesik ince çizgi, orta = ince çizgi, yüksek = katlanmış köşe. Kalın çerçeve yok.
- Sadece başlangıcı ya da sadece bitişi olan görevler kart değil, renkli bir çizgi ve solan bir geçiş olarak gösterilir.
- Haftalık takvimde boş saatler daralır (ayar ile kapatılabilir). Görünen alana göre saat yüksekliği hesaplanır; sadece sığmayan saatler kaydırmayla görünür.
- Takvim arka planı siyah-beyaz mantar pano dokusu; renk değil, doku.
- Üst banner: çalışma masası çizgi illüstrasyonu. Dikkat çekmez, konuyla ilgilidir.
- Anytime görevleri: noktalı daire ikonu, takvim dışında; dashboard'da ayrı panel.

## Bilinen eksikler
- Veri sahte; API bağlantısı yok.
- Şifre sıfırlama, şifre değiştirme ve hesap silme yalnızca arayüz düzeyinde.
- Koyu tema ve telefon düzeni referansta kontrol edildi ama her ekranda ayrıca test edilmedi.
- Tasks sayfasında yüksek görev sayısında performans testi yapılmadı.
