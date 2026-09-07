-- =====================================================================
-- 002 — danisan.gorunen_ad
-- supabase.sql'i zaten çalıştırdıysan bunu SQL Editor'de çalıştır.
-- Sıfırdan kuruyorsan gerek yok: supabase.sql güncellendi, içinde var.
-- Idempotenttir.
-- =====================================================================

alter table danisan add column if not exists gorunen_ad text;

-- Danışan RPC'leri artık selamda kullanılacak adı da döndürüyor.
-- Yedek zinciri SQL'de: gorunen_ad boşsa takma_ad.

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

-- Terapist tarafı ham değeri görür (boşsa null), yedeklenmiş hâlini değil.
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

grant execute on function
  public.gun_getir(text, date),
  public.gecmis_getir(text),
  public.y_ozet(text)
to anon;

-- AB-01'e görünen ad vermek istersen:
-- update danisan set gorunen_ad = 'Ada' where takma_ad = 'AB-01';
