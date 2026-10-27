# KADRAN — Yol Haritası Denetimi ve Uygulama Durumu

Kaynak: `Design Tools/KADRAN Yol Haritası Yeniden Tasarım ve Yeni Özellikler.pdf` (14 sayfa, tamamı okundu),
`Design Tools/design-reference.html`, `Design Tools/src/*`, `README.md`, `AGENTS.md`.

Bu dosya bir "tamamlandı" beyanı değildir: her madde aşağıda kod/test kanıtıyla veya açık eksik notuyla işaretlenmiştir.

- `[x]` kodda var ve test/build ile doğrulandı
- `[~]` kısmen var; eksik kısım yazılı
- `[ ]` yok

## Bu oturumda yapılanlar

1. **Backend — ayar doğrulaması** (README "Technical follow-ups")
   - `PATCH /auth/me`: `dayStartHour`/`dayEndHour` tek başına gönderilince mevcut diğer sınıra karşı kontrol edilir (`auth.service.js`).
   - `hideCompleted` yalnızca gerçek boolean kabul eder; `"false"` artık `true` olmaz.
2. **Backend — kayıt/giriş girdi tipi**: `email` string değilse 400 doğrulama hatası (eskiden `trim()` 500 üretiyordu).
3. **Backend — özel renk (Faz 2, adım 3)**: `isValidColor` artık 6 haneli hex (`#rrggbb`, büyük/küçük harf fark etmez) kabul eder; `#fff`, isimli renkler ve dizi/sayı gibi tipler reddedilir. Kayıtta renk küçük harfe normalize edilir (`normalizeColor`, `task.service.js` create + update).
4. **Frontend — öncelik görsel kanalı (Faz 3.1)**: `PRIORITY_STYLE` (`taskRules.js`) tek tanım; takvim kartında ve çok günlü çubukta ikon + erişilebilir etiket. Çerçeve CSS'i: HIGH 2 px kırmızı halka, MEDIUM 1 px, LOW kesikli. (Görsel olarak doğrulanmadı, bkz. aşağı.)
5. **Frontend — takvim grid matematiği (Faz 3, `yForMinute`)**: `getGridPosition`/`getMinuteAtPosition` bileşenden çıkarılıp `calendarUtils.js` içinde `yForMinute`/`minuteForY` olarak dışa aktarıldı; davranış aynı; birim testleri eklendi (`npm --prefix kadran-frontend test`).
6. **Frontend — özel renk seçici (Faz 2, adım 3)**: native `<input type="color">`, 6 haneli hex metin kutusu (geçersizse hata), son 5 özel renk (`localStorage`, try/catch'li), açık renk için kontrast uyarısı.
7. **Frontend — dashboard karşılaması (Faz 1B)**: "Welcome back, X" yerine "Good morning/afternoon/evening, X" (dil kararı için bkz. açık sorular).

## Doğrulama sonuçları (bu oturum)

| Komut | Sonuç |
|---|---|
| `npm --prefix kadran-backend test` | 56/56 geçti (baseline 48 + 8 yeni: ayar sınırları, hideCompleted, hex renk, email tipi) |
| `npm --prefix kadran-frontend run lint` | Temiz |
| `npm --prefix kadran-frontend run build` | Başarılı; yalnızca bilinen >500 kB chunk uyarısı |
| `npm --prefix kadran-frontend test` | 5/5 geçti (`calendarUtils.test.js`) |
| `git diff --check` | Temiz |
| `/_ui` taşma kontrolü (Playwright, Vite dev) | 390 / 1024 / 1440 px: yatay taşma yok |

Çalıştırılamayan / doğrulanamayan:
- **Prisma motor indirmesi** (`binaries.prisma.sh`) bu ortamda engelli; `prisma generate`, `migrate status` ve DB'li uçtan uca test çalıştırılamadı. Backend testleri DB gerektirmez ve geçti.
- **Gerçek hesapla giriş/kayıt**: yapılmadı (parola istenmedi). Kullanıcı kendi hesabıyla test etmeli.
- **Kimlik doğrulamalı ekranlar** (Dashboard, Takvim, Görevler, form, Ayarlar): DB olmadan giriş yapılamadığı için görsel olarak denetlenemedi. Yalnızca `/_ui` denendi.
- **Yeni öncelik çerçevesi ve özel renk seçici görsel kontrolü**: kimlik gerektirdiği için ekran görüntüsü alınamadı; kod ve derleme doğrulandı, ekranda kontrol edilmeli.

## PDF gereksinim checklist'i (kanıtlı)

### Faz 0 — Tasarım sistemi temeli
- [x] Renk/yazı/köşe token'ları `index.css` `:root` içinde; koyu tema `[data-theme]` ve `prefers-color-scheme` ile tanımlı (`index.css`).
- [x] `tailwind.config.js` `theme.extend.colors` ve `fontFamily` token'lara bağlı.
- [x] Tip renkleri ve öncelik renkleri token olarak var (`--color-course`, `--color-priority-high` …); backend `colors.js` ile frontend `TYPE_COLORS` aynı değerler.
- [x] Ortak primitifler mevcut: `components/ui/` → `Button`, `Modal`, `Switch`, `Slider`, `Skeleton`, `Field`, `Badge`.
- [x] `/_ui` stil sayfası (yalnızca geliştirme) mevcut ve taşma yok.
- [~] Eski sayfaların yeni primitiflere geçişi yapılmadı: `Switch` hiçbir sayfada kullanılmıyor (checkbox 7 dosyada), `Modal` yalnızca `ui/` içinde; `TaskDetailModal` ve `ConfirmDialog` kendi markup'ını kullanıyor. `Slider` kullanılmıyor.
- [ ] Hardcoded Tailwind palet sınıfları (`slate-*`, `blue-*`…) 6 yerde hâlâ var; token'a taşınmalı.
- [ ] Erişilebilir Radix/bağımlılık kararı verilmedi; mevcut `Modal` Esc ve odak tuzağı içeriyor (kendi yazılmış).

### Faz 1A — Görev listesi sıralama
- [x] `GET /tasks` `sort` (`date|priority|title|created|type`) ve `order` (`asc|desc`) validator'da; bilinmeyen değer 400 (`task.validator.js`, test: `validator.test.js`).
- [x] Sıralama sunucuda, sayfalamadan önce; eşit değerler `id` ile kararlı (`task.db.js` `buildOrderBy`, test: "server sorting applies to paginated tasks…").
- [x] Seri kısayolu (`collapseSeries`) aynı karşılaştırıcıyı kullanır (`compareCollapsedRows`).
- [x] `TasksPage` sıralama `<select>` + yön düğmesi, URL'ye yazılıyor (`sort`, `order`).
- [x] README `GET /tasks` tablosu güncel.
- [ ] `priority` sıralaması Prisma/PostgreSQL enum sırasına dayanır (`LOW < MEDIUM < HIGH` deklarasyon sırası). Prisma Studio/DB'de doğrulanmalı (PDF'in istediği "ilk denemede Studio ile doğrula" adımı yapılamadı).

### Faz 1B — Kullanıcı adı ve unvan
- [x] Şema: `displayName String?`, `headline String?` (`schema.prisma`); migration `20261027004500_user_profile` mevcut. Migration durumu DB'de README'ye göre "up to date" (bu oturumda DB'ye dokunulmadı).
- [x] `auth.db.js` select listesinde; `serializeUser` ve `GET/PATCH /auth/me` içinde.
- [x] Sınırlar: ad ≤ 50, unvan ≤ 80, trim, boş → `null`; tip hatası 400 (`auth.service.test.js`).
- [x] Kayıt isteğe bağlı alanları zorunlu kılmaz (test: "registration keeps profile fields optional").
- [x] Ayarlar sayfasında "Profil" bölümü (`SettingsPage.jsx`); üst menüde ad/e-posta ve baş harf avatarı (`Layout.jsx`).
- [x] Dashboard karşılaması: "Good morning, Ad" (bu oturum).
- [~] Auth servisinde `weekStartsOn`/`hideCompleted` doğrulaması PDF'in istediği tutarlılıkta (bu oturumda `hideCompleted` düzeltildi).
- [ ] Profil fotoğrafı: PDF'te "sonraya bırakılabilir" olarak işaretli; yapılmadı (bilinçli).

### Faz 2 — Görev oluşturma ve düzenleme ekranı
- [~] `TaskCreatePage.jsx` artık 519 satır ve alt bileşenlere (`components/task-form/*`) bölünmüş; ancak `useTaskForm` hook'u yok — form durumu hâlâ sayfada. Payload kurma aynı kaldı.
- [ ] Analog saat (SVG kadran, `atan2`, 5 dk yuvarlama, 24/12 halka): yok. Mevcut `ClockTimeInput.jsx` saat/dakika seçici (grid) ve kendi klavye davranışı var; PDF'in analog kadranı değil. Klavye ile saat girişi kısmen mevcut (`onKeyDown`).
- [~] Native `type="time"` girişi 5 yerde kaldı (PDF 7 demişti): 4'ü `TaskRecurrenceFields.jsx` (tekrar saatleri), 1'i `ClockTimeInput.jsx` (yazarak giriş yedeği). Tekrar saatleri `ClockTimeInput`'a taşınmadı.
- [ ] "Süre önerisi" (30 dk / 1 sa / 1,5 sa / 2 sa) yok.
- [x] Özel hex renk + doğrulama + son kullanılanlar + kontrast uyarısı (bu oturum; görsel doğrulama bekliyor).
- [ ] Switch / segmented control / slider ile tip-öncelik-tekrar-süre yerleşimi: yok (Switch hiç kullanılmıyor).
- [x] Canlı önizleme kartı: mevcut (`TaskCreatePage`'de önizleme). Kaydet düğmesi sabit alt çubukta mı: doğrulanmadı.
- [ ] Dört modun (create / edit-single / edit-occurrence / edit-series) elle denemesi yapılmadı; backend testleri geçiyor ama UI kontrolü yok.

### Faz 3 — Takvimi öne çıkarma
- [x] 3.1 Öncelik kenarlığı: `PRIORITY_STYLE` tek tanım, kart ve çubukta ikon + etiket, çerçeve CSS'i (bu oturum; görsel doğrulama bekliyor).
- [~] 3.2 Açıklama gösterimi: `description` takvim kartında gösterilmiyor (`CalendarEventCard` description kullanmıyor). Hover kartı yok. Tek bir gösterim kuralı (`occurrence` vs `series`) uygulanmadı.
- [ ] 3.3 `TaskDetailModal` ve `ConfirmDialog` yeniden yazımı (renkli üst şerit, rozetler, segmented "Bu oluşum / Tüm seri", geçiş animasyonu): yok.
- [~] 3.4 Boş saat daraltma: var (`compactEmptyHours`, `COMPACT_HOUR_HEIGHT = 16`, README'de ayar). "Boş zaman etiketi" (B seçeneği) yok.
- [x] `yForMinute`/`minuteForY` tek çift olarak `calendarUtils.js`'te; 5 birim testi (`calendarUtils.test.js`).
- [ ] 3.5 OPEN_ENDED / DEADLINE çizgi olarak (üst katman, `pointer-events: none`, DEADLINE bayrak, OPEN_ENDED başlangıç noktası): yok. Hâlâ `layoutDayEvents` ile marker olarak yan yana yerleşiyor.
- [ ] 3.6 "Şimdi" kırmızı çizgisi: yok (haftalık görünümde şu an bugünü gösteren çizgi bulunmadı).
- [ ] Çizgi katmanı / "Haftalık görünümde boş saatleri vurgula" (B): yok.
- [ ] Kontrol: aynı saatte iki timed + bir deadline, boş hafta, gece yarısı görevi — elle denenmedi (kimlik gerektirir).

### Faz 4 — Takvimden gün seçerek görev ekleme
- [~] Hafta görünümünde boş saat aralığı sürüklenince tek gün `TIMED` taslak formu açılır (README "drag to select the duration"); `onPointerDown/Up` WeekView'da mevcut.
- [~] Form tarafı: `TaskCreatePage` `date`, `startTime`, `endTime` query parametrelerini okur ve geçersiz değerleri yok sayar. PDF örneğindeki `start`/`end`/`until` adları kullanılmadı — mevcut sözleşme korundu (karar gerekiyor, bkz. açık sorular).
- [ ] Ay görünümünde tıklayıp sürükleyerek çok günlü (`MULTI_DAY`) taslak: yok.
- [ ] Hafta görünümünde "All Day" şeridinde gün sürükleme: yok.
- [ ] Hızlı ekleme popover'ı (başlık, tip, saat, "Oluştur", "Daha fazla seçenek"): yok.
- [ ] `useDragSelect` hook'u: yok (sürükleme WeekView içinde satır içi).
- [ ] Dokunmatik "uzun basış" — PDF'te ayrı iş olarak işaretli; yapılmadı.

### Faz 5 — İskelet yükleme ve hız
- [ ] İskelet: yalnızca `UiPage` `Skeleton` kullanıyor; Takvim/Dashboard/Görevler hâlâ "Loading..." metni gösteriyor.
- [ ] Ölçüm (DevTools / Lighthouse, önce/sonra): yapılmadı; `vite build` chunk uyarısı sürüyor (587 kB).
- [ ] Önbellek (TanStack Query veya `Map` tabanlı hafta önbelleği): yok.
- [ ] `React.lazy` ile sayfa bölme: yok.
- [~] Backend: `Promise.allSettled` ile çoklu `/tasks` isteği ve `from/to` sorgusu için `EXPLAIN`/birleşik indeks — ölçülmedi; indeks migration'ı gerektirir, yapılmadı (onay gerekir).

### Ek fikirler, riskler, açık sorular
- Ek fikirler (klavye kısayolları, sınav geri sayımı, açık/koyu tema, hafta özeti, geri al, toplu ders ekleme, sürükle-bırak, `.ics` dışa aktarma): **hiçbiri başlanmadı**.
- Boş durum (empty state) yönlendirmesi: yok.
- Açık sorular (PDF): boş saat (A/B), arayüz dili, tema (açık/koyu/ikisi), "unvan" serbest metin mi, analog saat 24 saat mi, takvimden ekleme popover mı.

## Açık teknik borçlar (README "Technical follow-ups")
- [ ] Collapsed-series listesi bellekte gruplandırılıyor (`GET /tasks?collapseSeries=true`); DB'ye taşınmalı.
- [x] Kayıt/giriş: e-posta tipi (bu oturum).
- [ ] Görev + etiket oluşturma tek transaction değil (`task.service.js`); `prisma.$transaction` ile sarılmalı. Prisma çalıştırılamadığı için bu oturumda yapılmadı (test edilemez).
- [ ] Build boyutu: route-level code splitting yok.
- [ ] Repo köküne ait boş `package-lock.json` ve kullanılmayan starter varlıkları (`react.svg`, `vite.svg`, `hero.png`) temizlenmedi.

## Veritabanı
- Bu oturumda **hiçbir migration çalıştırılmadı, Neon'a dokunulmadı, reset yapılmadı.**
- Yeni migration gerektiren madde yok: renk hex kabulü bir sözleşme değişikliği, şema değişikliği değil; profil alanları zaten migration ile eklenmiş.
- Gelecekte gerekecek olabilecek şema değişiklikleri (`EXPLAIN` sonrası `(userId, date)` indeksi, `deletedAt` vb.) için önce onay alınmalı.

## Açık sorular (kullanıcı kararı)
1. Boş saatler: daraltma (A) mı, boş zaman etiketi (B) mi?
2. Arayüz dili: şu an İngilizce; Türkçe mi, ikisi mi?
3. Tema: açık, koyu veya ikisi birden? (`/_ui` iki temayı da gösteriyor.)
4. Form query parametre adları: mevcut `startTime`/`endTime` mi, PDF'in `start`/`end`/`until` mi?
5. Analog saat: 24 saat tek kadran mı, 12 saat + AM/PM mi?
6. Takvimden ekleme: hızlı popover mı, doğrudan tam form mu?

## Sonraki adımlar (öncelik sırasına göre)
1. Faz 3.5 + 3.6: OPEN_ENDED/DEADLINE çizgileri ve "şimdi" çizgisi (mevcut `yForMinute` üzerine).
2. Faz 2 adım 1: `useTaskForm` hook'u (davranış değişmeden) ve dört modu elle denemek (kimlik gerekir).
3. Faz 2 adım 2: analog saat `TimeField` (SVG, klavye alternatifi).
4. Faz 2 adım 4: `Switch` + segmented control + süre slider'ı.
5. Faz 3.3: `TaskDetailModal` / `ConfirmDialog`'u `ui/Modal` üzerine yeniden yazma.
6. Faz 4: `useDragSelect` ve ay görünümünde çok günlü sürükleme; query param sözleşmesi kararı sonrası.
7. Faz 5: iskelet bileşenleri, `React.lazy`, önbellek; ölçümle birlikte.
8. Prisma engine erişilebilir olduğunda: `prisma generate`, `prisma migrate status` (salt okunur) ve priority enum sıralamasının DB'de doğrulanması.

## Doğrulama komutları
```bash
npm --prefix kadran-backend test
npm --prefix kadran-frontend run lint
npm --prefix kadran-frontend run build
npm --prefix kadran-frontend test
git diff --check
```
Salt okunur Neon kontrolü (yalnızca bilgi amaçlı, kullanıcı çalıştırır):
```bash
cd kadran-backend && npx prisma migrate status
```
