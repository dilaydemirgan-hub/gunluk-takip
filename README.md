# Günlük Takip

Terapist bir danışana gün gün görev atar; danışan kendine özel linkten girip
o günü doldurur. Şifre, e-posta, hesap yok — yalnızca link.

- `#/a/<kod>` — danışan paneli
- `#/y/<admin_kod>` — terapist paneli
- Başka her adres nötr "Bağlantı geçersiz" ekranı gösterir.

## Kurulum

### 1. Supabase projesi

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje aç.
2. Dashboard → **SQL Editor** → `supabase.sql` dosyasının tamamını yapıştır → **Run**.
   Dosya idempotenttir, gerekirse tekrar çalıştırılabilir.
   Şemayı daha önce kurduysan sadece `supabase-002-gorunen-ad.sql` yeter —
   `supabase.sql` zaten güncel, sıfırdan kurulumda 002'ye gerek yok.
3. Dashboard → **Settings → API** → **Project URL** ve **anon public** anahtarını kopyala.

Şema hakkında bilinmesi gerekenler:

- Dört tabloda da RLS açık ve **hiç politika yok** → anon anahtarı tablolara
  doğrudan erişemez.
- Tüm erişim `SECURITY DEFINER` fonksiyonlar üzerinden; her fonksiyonun ilk işi
  kodu doğrulamak.
- Danışan kodu yalnızca `gun_getir`, `gun_kaydet`, `gecmis_getir` çağırabilir;
  görev tablosuna yazamaz. Admin kodu danışan fonksiyonlarını çağıramaz.
- `gun_kaydet` yalnızca **bugün ve dün** için yazar; daha eski veya ileri tarih
  reddedilir. Gün sınırı `Europe/Istanbul` saatiyle hesaplanır.
- `danisan.gorunen_ad` (nullable) danışan ekranındaki selamda kullanılır;
  boşsa `takma_ad`'a düşer. Yedek zinciri SQL'de, tek yerde.

### 2. Ortam değişkenleri

`.env` (git'e girer, anon anahtarı zaten herkese açıktır):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`.env.local` (git'e **girmez**, sadece seed için gerekir):

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Bağımlılıklar ve ilk danışan

```bash
npm install
npm run seed -- "Takma Ad"     # kod ve admin_kod'u konsola basar
npm run dev
```

`npm run seed` iki link birden yazdırır: biri danışan, biri terapist için.
Servis anahtarını .env.local'e koymak istemiyorsan aynı işi Supabase SQL
Editor'den de yapabilirsin — `supabase.sql` dosyasının en altındaki
yorumlanmış `insert` satırını çalıştırman yeterli.

## Deploy — GitHub Pages

`vite.config.ts` içindeki `base` repo adına ayarlı (`/gunluk-takip/`).
Repo adı farklıysa orayı güncelle.

```bash
npm run deploy       # build alır ve gh-pages dalına iter
```

Sonra GitHub'da **Settings → Pages → Source: Deploy from a branch → gh-pages**.
Adres `https://<kullanici>.github.io/gunluk-takip/#/a/<kod>` biçiminde olur.

Uygulama `HashRouter` kullanır; GitHub Pages sunucu tarafı yönlendirme
yapamadığı için bu zorunlu.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run lint` | Oxlint |
| `npm run preview` | Derlemeyi yerelde sunar |
| `npm run seed` | Yeni danışan + kodlar |
| `npm run deploy` | GitHub Pages'e çıkar |

## Dosya düzeni

```
supabase.sql              tablolar, RPC'ler, yetkiler
scripts/seed.mjs          danışan oluşturma
src/lib/tipler.ts         paylaşılan tipler
src/lib/supabase.ts       istemci
src/lib/api.ts            RPC sarmalayıcıları + hata eşleme
src/lib/tarih.ts          tarih yardımcıları (Türkçe biçimler)
src/ekranlar/             DanisanEkrani, TerapistEkrani
src/bilesenler/           kartlar, ızgara, kaydırıcı, düzenleyici
```

## Veri modeli

`danisan` → `gorev` (gün + tür + başlık) → `isaret` (yapıldı mı)
ve `gun` (kaygı, kaçınma, not, gönderim saati).
Tek danışanla başlar ama model çok danışanlıdır: yeni bir satır `danisan`
eklemek yeni bir link demek.
