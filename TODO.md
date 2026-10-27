# KADRAN — AI Implementation Handoff

## Mission

Continue implementation of the KADRAN redesign. Do not stop at summarizing the
repository or checking the login issue. Audit the existing app against the
original design reference and the complete roadmap PDF, implement every
applicable requirement that is still missing, validate it, and keep this file
updated.

## Copy/paste task for the next AI

> KADRAN projesinde tasarım ve yol haritası uygulamasını devral ve gerçekten
> tamamla. Sadece analiz/plan/rapor verip durma; eksikleri kodda uygula,
> doğrula ve bu dosyadaki ilerlemeyi güncelle.
>
> ### Önce okunacak kaynaklar
> 1. Proje kökündeki `README.md`, `TODO.md` ve varsa `AGENTS.md`/agent
>    yönergeleri.
> 2. `Design Tools/KADRAN Yol Haritası Yeniden Tasarım ve Yeni Özellikler.pdf`
>    dosyasının tamamı. Her gereksinimi tek tek çıkar; başlıkları veya yalnızca
>    ilk sayfaları okuyup varsayım yapma.
> 3. Tasarım karşılaştırması için `Design Tools/design-reference.html`,
>    `Design Tools/src/styles.css`, `Design Tools/src/body.html` ve
>    `Design Tools/src/app.js`.
> 4. İlgili mevcut React sayfaları/bileşenleri, frontend yardımcıları,
>    backend API/service/validator/Prisma katmanı ve mevcut testler.
>
> ### Nasıl ilerle
> - PDF’deki her maddeyi gerçek kodla karşılaştır. Bu dosyada “tamamlandı”
>   yazması tek başına kanıt değildir; doğrudan kodu/testi/ekranı kontrol et.
> - PDF ve tasarım referansını kaynak gereksinim olarak al, fakat prototipteki
>   sahte veri ve eski API alan adlarını gerçek backend sözleşmesi sanma.
>   Mevcut KADRAN veri modeli ve API’si yetkilidir.
> - Eksik/görsel olarak yarım kalan maddeleri mevcut React/Vite ve
>   Express/Prisma yapısını koruyarak uygula. Dashboard, Calendar, Tasks,
>   create/edit form, Settings ve Login/Register dahil tüm kapsamı denetle;
>   çizimler, dokular, butonlar, switch’ler, hizalama ve dar ekranları da
>   karşılaştır.
> - Özelliklerin bütün ilgili yüzeylerde tutarlı olduğundan emin ol. Backend
>   gerektiren bir yol haritası maddesi varsa router/validator/controller/
>   service/database/test katmanlarını izleyip frontend’e bağla.
> - İlişkili eksikleri toplu biçimde tamamla; küçük değişikliklerde durup
>   kullanıcıdan devam izni isteme. Gerçekten bloklayan karar veya veri tabanı
>   değişikliği gerekiyorsa önce sor.
> - Hiçbir zaman parola, token veya gizli `.env` değerini isteme/gösterme/commit
>   etme. `Design Tools/` içindeki orijinal kaynakları silme veya değiştirme;
>   bunlar salt-okunur referanstır.
> - Veritabanını resetleme. Migration gerekiyorsa önce hedef Neon branch’ini ve
>   migration planını açıkça bildirip kullanıcı onayı al; onaysız migration
>   çalıştırma.
> - Tüm PDF gereksinimleri için bu dosyada izlenebilir bir checklist tut:
>   tamamlananları kod/test kanıtıyla işaretle; eksik veya uygulanamaz olanları
>   nedeni ve sonraki somut adımla bırak. “Her şey tamam” deme, ölçülebilir
>   doğrulama yap.
>
> ### Doğrulama ve bitiş koşulları
> - Mevcut test/lint/build komutlarını kullan; odaklı testler ekle ve tüm
>   ilgili backend testlerini çalıştır.
> - Frontend’i en az 390, 1024 ve 1440 px’te kontrol et. Taşma, bozuk
>   hizalama, tema uyumsuzluğu ve ana etkileşimleri denetle.
> - `git diff --check` çalıştır; test sonuçlarını checklist’e yaz.
> - Gerçek kullanıcının hesabıyla login/register denemesi gerekiyorsa kullanıcı
>   kendisi yapar. Asla parola isteme; bunu tek engel gibi gösterip tasarım/
>   roadmap denetimini bırakma.
> - Son yanıtta tamamlananları, doğrulanamayanları, nedenlerini ve açık kalan
>   somut işleri kısa ve açık bildir.

## Known verified baseline

- Latest implementation commit before this handoff update:
  `78760be` (`feat: complete Kadran design and auth updates`).
- The user's reported UI/auth changes were committed in that implementation.
- Neon `prisma migrate status` reported `Database schema is up to date!` on
  2026-10-27. This is a point-in-time check, not permission to migrate/reset.
- Frontend lint/build and all 48 backend tests passed after those changes.
- Vite reports a non-blocking JavaScript chunk above 500 KB.
- A real successful login/registration has not been tested with the user's
  account. Never request credentials; have the user test when necessary.

## Requirement audit checklist

The next AI must verify each item directly against the PDF and current app.
These entries are not marked complete merely because related code exists.

- [ ] Extract the entire PDF roadmap into actionable requirements and add
      individual traceable checklist entries below.
- [ ] Compare every roadmap requirement with existing implementation; record
      file/test/screen evidence and mark verified items.
- [ ] Implement all remaining design, responsive, interaction, accessibility,
      and backend/API requirements from the roadmap.
- [ ] Verify Dashboard, Calendar week/month, Tasks list/grid, task create/edit,
      Settings, Login and Register against the references at target widths.
- [ ] Run frontend lint/build, backend tests, focused new tests, and diff check.
- [ ] Report any remaining item that truly requires user action, external
      access, or explicit database approval.

## Project conventions and safety

- Keep backend features in the existing router, validator, controller, service,
  and database-layer pattern.
- Enforce authentication and ownership in backend operations.
- Keep task rules consistent between
  `kadran-frontend/src/utils/taskRules.js` and
  `kadran-backend/src/features/task/task.rules.js`.
- Preserve existing API contracts unless a roadmap requirement calls for a
  coordinated, tested change.
- Keep `Design Tools/` as a read-only source archive.
- Update this handoff as requirements are audited and implemented.

## Verification commands

Run from the repository root:

```powershell
npm.cmd --prefix kadran-frontend run lint
npm.cmd --prefix kadran-frontend run build
npm.cmd --prefix kadran-backend test
git diff --check
```

Read-only Neon migration status (run from `kadran-backend`):

```powershell
npx.cmd prisma migrate status
```
