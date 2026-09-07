# Günlük Takip — Spec

Terapist bir danışana gün gün görev atar; danışan kendine özel linkten girip
o günü doldurur. Tek danışanlı başlar ama veri modeli çok danışanlıdır.

## Rotalar (HashRouter — GitHub Pages için zorunlu)
- `#/a/:kod`  → danışan paneli (yazabilen taraf)
- `#/y/:adminKod` → terapist paneli
- Kod yoksa/yanlışsa nötr "Bağlantı geçersiz" ekranı. Başka hiçbir giriş yok.

## Veri modeli (Supabase / Postgres)
```sql
create table danisan (
  id uuid primary key default gen_random_uuid(),
  takma_ad text not null,
  kod text unique not null,
  admin_kod text unique not null,
  created_at timestamptz default now()
);
create table gorev (
  id uuid primary key default gen_random_uuid(),
  danisan_id uuid references danisan(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('davranis','kesif','sabit')),
  baslik text not null,
  sira int default 0
);
create table isaret (
  gorev_id uuid primary key references gorev(id) on delete cascade,
  yapildi boolean not null default false,
  updated_at timestamptz default now()
);
create table gun (
  danisan_id uuid references danisan(id) on delete cascade,
  tarih date not null,
  kaygi int check (kaygi between 0 and 10),
  kacinma int check (kacinma between 0 and 10),
  not_metni text,
  gonderildi_at timestamptz,
  primary key (danisan_id, tarih)
);
alter table danisan enable row level security;
alter table gorev  enable row level security;
alter table isaret enable row level security;
alter table gun    enable row level security;
-- politika YOK: anon anahtar tablolara doğrudan erişemez, her şey RPC üzerinden
-- fonksiyonlar SECURITY DEFINER olacak, sonunda:
-- grant execute on all functions in schema public to anon;
```

## RPC (hepsi SECURITY DEFINER, ilk iş kodu doğrulamak)
- `gun_getir(p_kod text, p_tarih date)` → o günün görevleri + işaretleri + gün kaydı + seri bilgisi
- `gun_kaydet(p_kod text, p_tarih date, p_isaretler jsonb, p_kaygi int, p_kacinma int, p_not text)`
  → **sadece bugün ve dün** yazılabilir, daha eski tarih reddedilir
- `gecmis_getir(p_kod text)` → son 30 gün: tarih + tamamlanan görev sayısı + toplam + kaygı/kaçınma
- `y_ozet(p_admin_kod text)` → tüm günlerin tam tablosu (notlar dahil)
- `y_gorev_ata(p_admin_kod text, p_tarih date, p_gorevler jsonb)` → o güne görev listesi yazar
- `y_gorev_kopyala(p_admin_kod text, p_kaynak date, p_hedef date)`

Danışan kodu yalnızca `gun_getir`, `gun_kaydet`, `gecmis_getir` çağırabilir;
görev tablosuna yazamaz. Admin kodu danışan fonksiyonlarını çağıramaz.
SQL fonksiyonlarını tek bir `supabase.sql` dosyasında topla.

## Danışan ekranı
1. Üstte tarih + takma adla kısa selam.
2. **Bugünün kartı**: görevler üç grupta (Davranış / Keşif / Sabit), her biri
   büyük dokunma alanlı checkbox. İşaretlenince yumuşak bir onay animasyonu.
3. İki kaydırıcı: Kaygı 0–10, Kaçınma 0–10.
4. Tek satırlık serbest alan: "Bugün aklımdan geçen cümle".
5. "Günü kaydet" butonu. Kaydedince gün kilitlenmez, gün içinde güncellenebilir.
6. **Seri (streak)**: gönderilmiş ardışık gün sayısı, alev ikonu + sayı.
   Ayrıca "en uzun seri" rozeti. Seri kırılınca sessizce sıfırlanır —
   uyarı, kırmızı renk, kaçırılan gün sayacı, "serini kaybettin" mesajı YOK.
7. **Geçmiş**: son 30 gün, küçük kareler ızgarası. Dolu günler tamamlanma
   oranına göre renk yoğunluğu alır; boş günler nötr gri, üzerinde yazı yok.
   Kareye dokununca o günün yaptıkları açılır.
8. **Keşif arşivi**: tamamlanmış keşif görevleri kart olarak birikir, ayrı
   sekmede koleksiyon gibi görünür. Bu ekranın duygusal ödülü burası.

## Terapist ekranı
- Gün gün tablo: tarih, tamamlanan/toplam, kaygı, kaçınma, not, gönderim saati.
- Herhangi bir güne görev ekleme/silme/sıralama; "dünkü görevleri kopyala".
- Boş günler burada net görünsün (danışan tarafının aksine).

## Tasarım
Sakin, klinik ama sıcak. Tek bir yumuşak vurgu rengi, bol beyaz alan,
yuvarlak köşeler, sistem fontu değil düzgün bir sans-serif. Mobil öncelikli —
tek elle kullanılacak. Ağır kütüphane, grafik kütüphanesi, dark mode toggle yok.
Tailwind kullan.

## Deploy
GitHub Pages'e çıkacak. `vite.config.ts` içinde `base` repo adına ayarlansın,
`npm run deploy` scripti (gh-pages) eklensin. Netlify KULLANMA.

## Yapılacaklar sırası
1. `supabase.sql` (tablolar + RPC) yaz, README'ye kurulum adımlarını koy.
2. Supabase client + kod doğrulama katmanı.
3. Danışan ekranı, sonra terapist ekranı.
4. Seed script: bir danışan kaydı oluşturup kod ve admin_kod'u konsola bassın.
