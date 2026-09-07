import { supabase, yapilandirildi } from './supabase'
import type { Gecmis, Gorev, GorevTaslak, GunVerisi, Ozet } from './tipler'

/** Sunucudan gelen bilinen hata anahtarları. */
export type HataKodu =
  | 'gecersiz_baglanti'
  | 'tarih_kilitli'
  | 'gecersiz_gorev'
  | 'gecersiz_deger'
  | 'yapilandirilmadi'
  | 'baglanti'

const BILINEN: HataKodu[] = [
  'gecersiz_baglanti',
  'tarih_kilitli',
  'gecersiz_gorev',
  'gecersiz_deger',
]

export class RpcHata extends Error {
  kod: HataKodu
  constructor(kod: HataKodu, mesaj?: string) {
    super(mesaj ?? kod)
    this.kod = kod
  }
}

const MESAJ: Record<HataKodu, string> = {
  gecersiz_baglanti: 'Bağlantı geçersiz.',
  tarih_kilitli: 'Bu gün artık düzenlenemiyor.',
  gecersiz_gorev: 'Görev bulunamadı, sayfayı yenile.',
  gecersiz_deger: 'Geçersiz değer.',
  yapilandirilmadi: 'Supabase bağlantısı yapılandırılmamış.',
  baglanti: 'Bağlantı kurulamadı, tekrar dene.',
}

export function hataMesaji(e: unknown): string {
  if (e instanceof RpcHata) return MESAJ[e.kod]
  return MESAJ.baglanti
}

async function cagir<T>(ad: string, parametreler: Record<string, unknown>): Promise<T> {
  if (!yapilandirildi) throw new RpcHata('yapilandirilmadi')

  const { data, error } = await supabase.rpc(ad, parametreler)

  if (error) {
    const metin = `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`
    const bulunan = BILINEN.find((k) => metin.includes(k))
    throw new RpcHata(bulunan ?? 'baglanti', error.message)
  }

  return data as T
}

/* ---- danışan ---- */

export function gunGetir(kod: string, tarih?: string) {
  return cagir<GunVerisi>('gun_getir', { p_kod: kod, p_tarih: tarih ?? null })
}

export function gunKaydet(
  kod: string,
  tarih: string,
  isaretler: { gorev_id: string; yapildi: boolean }[],
  kaygi: number | null,
  kacinma: number | null,
  not: string | null,
) {
  return cagir<GunVerisi>('gun_kaydet', {
    p_kod: kod,
    p_tarih: tarih,
    p_isaretler: isaretler,
    p_kaygi: kaygi,
    p_kacinma: kacinma,
    p_not: not,
  })
}

export function gecmisGetir(kod: string) {
  return cagir<Gecmis>('gecmis_getir', { p_kod: kod })
}

/* ---- terapist ---- */

export function yOzet(adminKod: string) {
  return cagir<Ozet>('y_ozet', { p_admin_kod: adminKod })
}

export function yGorevAta(adminKod: string, tarih: string, gorevler: GorevTaslak[]) {
  return cagir<Gorev[]>('y_gorev_ata', {
    p_admin_kod: adminKod,
    p_tarih: tarih,
    p_gorevler: gorevler,
  })
}

export function yGorevKopyala(adminKod: string, kaynak: string, hedef: string) {
  return cagir<Gorev[]>('y_gorev_kopyala', {
    p_admin_kod: adminKod,
    p_kaynak: kaynak,
    p_hedef: hedef,
  })
}
