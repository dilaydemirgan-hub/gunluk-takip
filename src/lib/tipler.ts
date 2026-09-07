export type Tur = 'davranis' | 'kesif' | 'sabit'

export const TUR_ADI: Record<Tur, string> = {
  davranis: 'Davranış',
  kesif: 'Keşif',
  sabit: 'Sabit',
}

export const TUR_SIRASI: Tur[] = ['davranis', 'kesif', 'sabit']

export type Gorev = {
  id: string
  tur: Tur
  baslik: string
  sira: number
  yapildi: boolean
}

export type GunKaydi = {
  kaygi: number | null
  kacinma: number | null
  not_metni: string | null
  gonderildi_at: string | null
}

export type Seri = {
  guncel: number
  en_uzun: number
}

/** gun_getir / gun_kaydet dönüşü */
export type GunVerisi = {
  takma_ad: string
  /** Selamda kullanılır; yedeği SQL'de takma_ad'a düşer. */
  gorunen_ad: string
  tarih: string
  bugun: string
  yazilabilir: boolean
  gorevler: Gorev[]
  gun: GunKaydi
  seri: Seri
}

export type GunOzeti = {
  tarih: string
  toplam: number
  tamamlanan: number
  kaygi: number | null
  kacinma: number | null
  not_metni: string | null
  gonderildi_at: string | null
  gorevler: Gorev[]
}

export type KesifKarti = {
  tarih: string
  baslik: string
}

/** gecmis_getir dönüşü */
export type Gecmis = {
  takma_ad: string
  gorunen_ad: string
  bugun: string
  gunler: GunOzeti[]
  kesif_arsivi: KesifKarti[]
  seri: Seri
}

/** y_ozet dönüşü */
export type Ozet = {
  takma_ad: string
  /** Terapist ham değeri görür: danışan koymadıysa null. */
  gorunen_ad: string | null
  kod: string
  bugun: string
  gunler: GunOzeti[]
}

/** y_gorev_ata girdisi */
export type GorevTaslak = {
  id: string | null
  tur: Tur
  baslik: string
}
