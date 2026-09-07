-- =====================================================================
-- Günlük Takip — Supabase / Postgres şeması
-- Supabase Dashboard → SQL Editor → tamamını yapıştır → Run.
-- Baştan sona idempotenttir, tekrar çalıştırılabilir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABLOLAR
-- ---------------------------------------------------------------------

create table if not exists danisan (
  id uuid primary key default gen_random_uuid(),
  takma_ad text not null,
  gorunen_ad text,
  kod text unique not null,
  admin_kod text unique not null,
  created_at timestamptz default now()
);

-- Şema daha önce kurulduysa kolonu sonradan ekle (bkz. 002 migration).
alter table danisan add column if not exists gorunen_ad text;

create table if not exists gorev (
  id uuid primary key default gen_random_uuid(),
  danisan_id uuid references danisan(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('davranis','kesif','sabit')),
  baslik text not null,
  sira int default 0
);

create table if not exists isaret (
  gorev_id uuid primary key references gorev(id) on delete cascade,
  yapildi boolean not null default false,
  updated_at timestamptz default now()
);

create table if not exists gun (
  danisan_id uuid references danisan(id) on delete cascade,
  tarih date not null,
  kaygi int check (kaygi between 0 and 10),
  kacinma int check (kacinma between 0 and 10),
  not_metni text,
  gonderildi_at timestamptz,
  primary key (danisan_id, tarih)
);

create index if not exists gorev_danisan_tarih_idx on gorev (danisan_id, tarih);
create index if not exists gun_gonderildi_idx on gun (danisan_id, tarih) where gonderildi_at is not null;

-- ---------------------------------------------------------------------
-- 2) RLS — politika YOK.
--    anon anahtarı tablolara doğrudan erişemez; her şey RPC üzerinden.
-- ---------------------------------------------------------------------

alter table danisan enable row level security;
alter table gorev  enable row level security;
alter table isaret enable row level security;
alter table gun    enable row level security;

revoke all on table danisan, gorev, isaret, gun from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) İÇ YARDIMCILAR (anon çağıramaz — en altta yetkileri geri alınıyor)
-- ---------------------------------------------------------------------

-- Uygulamanın "bugün"ü. Sunucu UTC olsa bile gün sınırı Türkiye saatiyle.
create or replace function public._bugun()
returns date
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (now() at time zone 'Europe/Istanbul')::date;
$$;

-- Karıştırılması kolay harf/rakamlar (0/O, 1/l/I) alfabede yok.
create or replace function public._kod_uret(p_uzunluk int default 10)
returns text
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  select string_agg(
    substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1),
    ''
  )
  from generate_series(1, p_uzunluk);
$$;

-- Danışan kodunu doğrular. Yanlışsa tek tip hata: hangi kısmın yanlış
-- olduğu sızmasın diye admin tarafıyla aynı mesaj.
create or replace function public._danisan_by_kod(p_kod text)
returns danisan
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v danisan;
begin
  if p_kod is null or length(btrim(p_kod)) = 0 then
    raise exception 'gecersiz_baglanti';
  end if;

  select * into v from danisan where kod = btrim(p_kod);

  if not found then
    raise exception 'gecersiz_baglanti';
  end if;

  return v;
end;
$$;

-- Terapist kodunu doğrular. Danışan kodu buradan geçemez (ayrı kolon).
create or replace function public._danisan_by_admin_kod(p_admin_kod text)
returns danisan
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v danisan;
begin
  if p_admin_kod is null or length(btrim(p_admin_kod)) = 0 then
    raise exception 'gecersiz_baglanti';
  end if;

  select * into v from danisan where admin_kod = btrim(p_admin_kod);

  if not found then
    raise exception 'gecersiz_baglanti';
  end if;

  return v;
end;
$$;

-- Bir günün görev listesi + işaretleri.
create or replace function public._gorev_listesi(p_danisan_id uuid, p_tarih date)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',      g.id,
        'tur',     g.tur,
        'baslik',  g.baslik,
        'sira',    g.sira,
        'yapildi', coalesce(i.yapildi, false)
      )
      order by g.sira, g.baslik
    ),
    '[]'::jsonb
  )
  from gorev g
  left join isaret i on i.gorev_id = g.id
  where g.danisan_id = p_danisan_id
    and g.tarih = p_tarih;
$$;

-- Seri: gönderilmiş ardışık gün sayısı (gaps-and-islands).
-- guncel: bugün veya dün ile biten seri; yoksa 0. Sessizce sıfırlanır.
create or replace function public._seri(p_danisan_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with g as (
    select tarih
    from gun
    where danisan_id = p_danisan_id
      and gonderildi_at is not null
      and tarih <= _bugun()
  ),
  isaretli as (
    select tarih, tarih - (row_number() over (order by tarih))::int as ada
    from g
  ),
  seriler as (
    select ada, count(*)::int as uzunluk, max(tarih) as son
    from isaretli
    group by ada
  )
  select jsonb_build_object(
    'guncel', coalesce(
      (select uzunluk from seriler where son >= _bugun() - 1 order by son desc limit 1),
      0
    ),
    'en_uzun', coalesce((select max(uzunluk) from seriler), 0)
  );
$$;

-- ---------------------------------------------------------------------
-- 4) DANIŞAN RPC'leri — sadece kendi gününü okur/yazar, görev tablosuna
--    yazamaz.
-- ---------------------------------------------------------------------

create or replace function public.gun_getir(p_kod text, p_tarih date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  d      danisan;
  v_bug  date;
  v_tar  date;
  v_gun  jsonb;
begin
  d := _danisan_by_kod(p_kod);

  v_bug := _bugun();
  v_tar := coalesce(p_tarih, v_bug);

  select jsonb_build_object(
           'kaygi',         gn.kaygi,
           'kacinma',       gn.kacinma,
           'not_metni',     gn.not_metni,
           'gonderildi_at', gn.gonderildi_at
         )
    into v_gun
    from gun gn
   where gn.danisan_id = d.id
     and gn.tarih = v_tar;

  if v_gun is null then
    v_gun := jsonb_build_object(
      'kaygi', null, 'kacinma', null, 'not_metni', null, 'gonderildi_at', null
    );
  end if;

  return jsonb_build_object(
    'takma_ad',    d.takma_ad,
    'gorunen_ad',  coalesce(nullif(btrim(coalesce(d.gorunen_ad, '')), ''), d.takma_ad),
    'tarih',       v_tar,
    'bugun',       v_bug,
    'yazilabilir', v_tar between v_bug - 1 and v_bug,
    'gorevler',    _gorev_listesi(d.id, v_tar),
    'gun',         v_gun,
    'seri',        _seri(d.id)
  );
end;
$$;

-- Sadece bugün ve dün yazılabilir. Daha eski / gelecek tarih reddedilir.
create or replace function public.gun_kaydet(
  p_kod       text,
  p_tarih     date,
  p_isaretler jsonb,
  p_kaygi     int,
  p_kacinma   int,
  p_not       text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d         danisan;
  v_bug     date;
  v_kayit   jsonb;
  v_gorev   uuid;
  v_yapildi boolean;
begin
  d := _danisan_by_kod(p_kod);
  v_bug := _bugun();

  if p_tarih is null or p_tarih > v_bug or p_tarih < v_bug - 1 then
    raise exception 'tarih_kilitli';
  end if;

  if (p_kaygi   is not null and p_kaygi   not between 0 and 10)
  or (p_kacinma is not null and p_kacinma not between 0 and 10) then
    raise exception 'gecersiz_deger';
  end if;

  if p_isaretler is not null and p_isaretler <> 'null'::jsonb then
    if jsonb_typeof(p_isaretler) <> 'array' then
      raise exception 'gecersiz_gorev';
    end if;

    for v_kayit in select value from jsonb_array_elements(p_isaretler) loop
      v_gorev   := nullif(v_kayit->>'gorev_id', '')::uuid;
      v_yapildi := coalesce((v_kayit->>'yapildi')::boolean, false);

      -- Görev bu danışanın ve bu günün olmak zorunda.
      if v_gorev is null or not exists (
        select 1 from gorev
        where id = v_gorev and danisan_id = d.id and tarih = p_tarih
      ) then
        raise exception 'gecersiz_gorev';
      end if;

      insert into isaret (gorev_id, yapildi, updated_at)
      values (v_gorev, v_yapildi, now())
      on conflict (gorev_id) do update
        set yapildi = excluded.yapildi,
            updated_at = now();
    end loop;
  end if;

  insert into gun (danisan_id, tarih, kaygi, kacinma, not_metni, gonderildi_at)
  values (
    d.id, p_tarih, p_kaygi, p_kacinma,
    nullif(btrim(coalesce(p_not, '')), ''),
    now()
  )
  on conflict (danisan_id, tarih) do update
    set kaygi         = excluded.kaygi,
        kacinma       = excluded.kacinma,
        not_metni     = excluded.not_metni,
        gonderildi_at = now();

  return gun_getir(p_kod, p_tarih);
end;
$$;

-- Son 30 gün + tüm zamanların keşif arşivi.
create or replace function public.gecmis_getir(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  d        danisan;
  v_bug    date;
  v_gunler jsonb;
  v_arsiv  jsonb;
begin
  d := _danisan_by_kod(p_kod);
  v_bug := _bugun();

  select coalesce(jsonb_agg(to_jsonb(x) order by x.tarih), '[]'::jsonb)
    into v_gunler
    from (
      select
        t.tarih,
        (select count(*) from gorev g
          where g.danisan_id = d.id and g.tarih = t.tarih)::int as toplam,
        (select count(*) from gorev g
           join isaret i on i.gorev_id = g.id
          where g.danisan_id = d.id and g.tarih = t.tarih and i.yapildi)::int as tamamlanan,
        gn.kaygi,
        gn.kacinma,
        gn.not_metni,
        gn.gonderildi_at,
        _gorev_listesi(d.id, t.tarih) as gorevler
      from (
        select s::date as tarih
        from generate_series(v_bug - 29, v_bug, interval '1 day') s
      ) t
      left join gun gn on gn.danisan_id = d.id and gn.tarih = t.tarih
    ) x;

  select coalesce(
           jsonb_agg(
             jsonb_build_object('tarih', g.tarih, 'baslik', g.baslik)
             order by g.tarih desc, g.sira
           ),
           '[]'::jsonb
         )
    into v_arsiv
    from gorev g
    join isaret i on i.gorev_id = g.id
   where g.danisan_id = d.id
     and g.tur = 'kesif'
     and i.yapildi;

  return jsonb_build_object(
    'takma_ad',     d.takma_ad,
    'gorunen_ad',   coalesce(nullif(btrim(coalesce(d.gorunen_ad, '')), ''), d.takma_ad),
    'bugun',        v_bug,
    'gunler',       v_gunler,
    'kesif_arsivi', v_arsiv,
    'seri',         _seri(d.id)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 5) TERAPİST RPC'leri — admin kodu danışan fonksiyonlarını çağıramaz
--    (danisan.kod ile eşleşme aranmaz, sadece danisan.admin_kod).
-- ---------------------------------------------------------------------

-- Tüm günlerin tam tablosu. Boş günler de satır olarak döner.
create or replace function public.y_ozet(p_admin_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  d        danisan;
  v_bug    date;
  v_bas    date;
  v_son    date;
  v_gunler jsonb;
begin
  d := _danisan_by_admin_kod(p_admin_kod);
  v_bug := _bugun();

  select coalesce(min(tarih), v_bug), coalesce(max(tarih), v_bug)
    into v_bas, v_son
    from (
      select tarih from gorev where danisan_id = d.id
      union
      select tarih from gun   where danisan_id = d.id
    ) z;

  -- Aralık: en eski kayıttan (en fazla 1 yıl geri) bugüne / en ileri güne.
  v_bas := greatest(least(v_bas, v_bug), v_bug - 365);
  v_son := greatest(v_son, v_bug);

  select coalesce(jsonb_agg(to_jsonb(x) order by x.tarih desc), '[]'::jsonb)
    into v_gunler
    from (
      select
        t.tarih,
        (select count(*) from gorev g
          where g.danisan_id = d.id and g.tarih = t.tarih)::int as toplam,
        (select count(*) from gorev g
           join isaret i on i.gorev_id = g.id
          where g.danisan_id = d.id and g.tarih = t.tarih and i.yapildi)::int as tamamlanan,
        gn.kaygi,
        gn.kacinma,
        gn.not_metni,
        gn.gonderildi_at,
        _gorev_listesi(d.id, t.tarih) as gorevler
      from (
        select s::date as tarih
        from generate_series(v_bas, v_son, interval '1 day') s
      ) t
      left join gun gn on gn.danisan_id = d.id and gn.tarih = t.tarih
    ) x;

  return jsonb_build_object(
    'takma_ad',   d.takma_ad,
    'gorunen_ad', d.gorunen_ad,
    'kod',        d.kod,
    'bugun',      v_bug,
    'gunler',     v_gunler
  );
end;
$$;

-- O günün görev listesini yazar. p_gorevler:
--   [{"id": null | uuid, "tur": "davranis|kesif|sabit", "baslik": "..."}]
-- Dizideki sıra = ekrandaki sıra. Listede olmayan görevler silinir;
-- id'si korunan görevlerin işaretleri kaybolmaz.
create or replace function public.y_gorev_ata(
  p_admin_kod text,
  p_tarih     date,
  p_gorevler  jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d         danisan;
  v         jsonb;
  v_id      uuid;
  v_tur     text;
  v_baslik  text;
  v_tutulan uuid[] := '{}';
  v_sira    int := 0;
begin
  d := _danisan_by_admin_kod(p_admin_kod);

  if p_tarih is null then
    raise exception 'gecersiz_deger';
  end if;

  if p_gorevler is null or jsonb_typeof(p_gorevler) <> 'array' then
    raise exception 'gecersiz_gorev';
  end if;

  for v in select value from jsonb_array_elements(p_gorevler) loop
    v_baslik := btrim(coalesce(v->>'baslik', ''));
    v_tur    := v->>'tur';

    continue when v_baslik = '';

    if v_tur is null or v_tur not in ('davranis','kesif','sabit') then
      raise exception 'gecersiz_gorev';
    end if;

    v_id := nullif(v->>'id', '')::uuid;

    if v_id is not null and exists (
      select 1 from gorev where id = v_id and danisan_id = d.id
    ) then
      update gorev
         set baslik = v_baslik,
             tur    = v_tur,
             tarih  = p_tarih,
             sira   = v_sira
       where id = v_id;
    else
      insert into gorev (danisan_id, tarih, tur, baslik, sira)
      values (d.id, p_tarih, v_tur, v_baslik, v_sira)
      returning id into v_id;
    end if;

    v_tutulan := v_tutulan || v_id;
    v_sira    := v_sira + 1;
  end loop;

  delete from gorev
   where danisan_id = d.id
     and tarih = p_tarih
     and not (id = any(v_tutulan));

  return _gorev_listesi(d.id, p_tarih);
end;
$$;

-- Kaynak günün görevlerini hedef güne ekler. Aynı tür+başlık zaten
-- varsa tekrar eklenmez; hedefteki mevcut görevler ve işaretler durur.
create or replace function public.y_gorev_kopyala(
  p_admin_kod text,
  p_kaynak    date,
  p_hedef     date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d      danisan;
  v_base int;
begin
  d := _danisan_by_admin_kod(p_admin_kod);

  if p_kaynak is null or p_hedef is null or p_kaynak = p_hedef then
    raise exception 'gecersiz_deger';
  end if;

  select coalesce(max(sira) + 1, 0) into v_base
    from gorev where danisan_id = d.id and tarih = p_hedef;

  insert into gorev (danisan_id, tarih, tur, baslik, sira)
  select d.id,
         p_hedef,
         k.tur,
         k.baslik,
         v_base + (row_number() over (order by k.sira, k.baslik))::int - 1
    from gorev k
   where k.danisan_id = d.id
     and k.tarih = p_kaynak
     and not exists (
       select 1 from gorev h
        where h.danisan_id = d.id
          and h.tarih = p_hedef
          and h.tur = k.tur
          and h.baslik = k.baslik
     );

  return _gorev_listesi(d.id, p_hedef);
end;
$$;

-- ---------------------------------------------------------------------
-- 6) YETKİLER
--    anon yalnızca 6 RPC'yi çağırabilir; tablolara ve iç yardımcılara
--    erişemez.
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant execute on all functions in schema public to anon;

revoke execute on function
  public._bugun(),
  public._kod_uret(int),
  public._danisan_by_kod(text),
  public._danisan_by_admin_kod(text),
  public._gorev_listesi(uuid, date),
  public._seri(uuid)
from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 7) SEED — bir danışan oluştur, kodları not al.
--    (npm run seed yerine buradan da yapabilirsin: alttaki satırı
--     seç ve Run'a bas, çıkan kod / admin_kod'u sakla.)
-- ---------------------------------------------------------------------

-- insert into danisan (takma_ad, gorunen_ad, kod, admin_kod)
-- values ('Danışan', null, public._kod_uret(10), public._kod_uret(14))
-- returning takma_ad, kod, admin_kod;
