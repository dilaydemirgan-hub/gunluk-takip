-- =====================================================================
-- 003 — Tek görevin işaretini anında kaydet.
-- Danışan her tike bastığında çağrılır; "Günü kaydet"e basmadan çıkınca
-- işaretler kaybolmasın diye. Gün kaydına (kaygı/kaçınma/not/gönderim)
-- dokunmaz, yani günü "gönderildi" saymaz.
-- Kurallar gun_kaydet ile aynı: yalnızca bugün ve dün, yalnızca kendi görevi.
-- İdempotent; tekrar çalıştırılabilir.
-- =====================================================================

create or replace function public.isaret_kaydet(
  p_kod      text,
  p_tarih    date,
  p_gorev_id uuid,
  p_yapildi  boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d     danisan;
  v_bug date;
begin
  d := _danisan_by_kod(p_kod);
  v_bug := _bugun();

  if p_tarih is null or p_tarih > v_bug or p_tarih < v_bug - 1 then
    raise exception 'tarih_kilitli';
  end if;

  if p_gorev_id is null or not exists (
    select 1 from gorev
    where id = p_gorev_id and danisan_id = d.id and tarih = p_tarih
  ) then
    raise exception 'gecersiz_gorev';
  end if;

  insert into isaret (gorev_id, yapildi, updated_at)
  values (p_gorev_id, coalesce(p_yapildi, false), now())
  on conflict (gorev_id) do update
    set yapildi = excluded.yapildi,
        updated_at = now();

  return jsonb_build_object('gorev_id', p_gorev_id, 'yapildi', coalesce(p_yapildi, false));
end;
$$;

grant execute on function public.isaret_kaydet(text, date, uuid, boolean) to anon;
