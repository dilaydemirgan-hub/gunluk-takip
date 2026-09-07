const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

/** 'YYYY-MM-DD' → yerel saat diliminden bağımsız Date (öğlen 12:00). */
export function ayristir(iso: string): Date {
  const [y, a, g] = iso.split('-').map(Number)
  return new Date(y, a - 1, g, 12)
}

export function isoYaz(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function gunEkle(iso: string, adet: number): string {
  const d = ayristir(iso)
  d.setDate(d.getDate() + adet)
  return isoYaz(d)
}

/** Pazartesi = 0 */
export function haftaGunu(iso: string): number {
  return (ayristir(iso).getDay() + 6) % 7
}

/** "7 Eylül" */
export function kisaTarih(iso: string): string {
  const d = ayristir(iso)
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`
}

/** "7 Eylül Pazartesi" */
export function uzunTarih(iso: string): string {
  const d = ayristir(iso)
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${GUNLER[d.getDay()]}`
}

/** Bugüne / düne göre insan okunur ad. */
export function gorecelTarih(iso: string, bugun: string): string {
  if (iso === bugun) return 'Bugün'
  if (iso === gunEkle(bugun, -1)) return 'Dün'
  if (iso === gunEkle(bugun, 1)) return 'Yarın'
  return uzunTarih(iso)
}

/** timestamptz → "21:40" */
export function saat(zaman: string | null): string {
  if (!zaman) return ''
  const d = new Date(zaman)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
