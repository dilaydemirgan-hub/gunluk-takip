import { GUN_KISA, haftaGunu, kisaTarih } from '../lib/tarih'
import type { GunOzeti } from '../lib/tipler'

/**
 * Yoğunluk yalnızca tamamlanma oranından gelir.
 * Boş gün = nötr gri-mavi, üzerinde yazı yok, uyarı yok.
 */
function yogunluk(gun: GunOzeti): 0 | 1 | 2 | 3 | 4 {
  if (!gun.gonderildi_at) return 0
  if (gun.toplam === 0) return 2
  const oran = gun.tamamlanan / gun.toplam
  if (oran <= 0) return 1
  if (oran < 0.5) return 2
  if (oran < 1) return 3
  return 4
}

const RENK = [
  'bg-doku-0',
  'bg-doku-1',
  'bg-doku-2',
  'bg-doku-3',
  'bg-doku-4 shadow-vurgu',
] as const

export function GecmisIzgara({
  gunler,
  sec,
}: {
  gunler: GunOzeti[]
  sec: (gun: GunOzeti) => void
}) {
  if (gunler.length === 0) return null

  // Sütunlar hafta gününe denk gelsin diye baştan boşluk bırak.
  const bosluk = haftaGunu(gunler[0].tarih)

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {GUN_KISA.map((g) => (
          <span key={g} className="text-center text-[0.65rem] font-medium text-silik">
            {g}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: bosluk }, (_, i) => (
          <span key={`bos-${i}`} aria-hidden="true" />
        ))}

        {gunler.map((gun) => (
          <button
            key={gun.tarih}
            type="button"
            onClick={() => sec(gun)}
            aria-label={kisaTarih(gun.tarih)}
            className={`aspect-square w-full cursor-pointer rounded-[0.55rem] ring-1 ring-white/5 ring-inset transition-transform duration-150 active:scale-88 ${
              RENK[yogunluk(gun)]
            }`}
          />
        ))}
      </div>
    </div>
  )
}
