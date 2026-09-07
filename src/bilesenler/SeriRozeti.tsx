import type { Seri } from '../lib/tipler'
import { AlevIkon } from './ikonlar'

/**
 * Seri kırılınca sessizce sıfırlanır: uyarı yok, kırmızı yok,
 * kaçırılan gün sayacı yok. Sıfırsa rozet hiç görünmez.
 */
export function SeriRozeti({ seri }: { seri: Seri }) {
  if (seri.guncel === 0 && seri.en_uzun === 0) return null

  return (
    <div className="flex items-center gap-2.5">
      {seri.guncel > 0 && (
        <span className="relative flex items-center gap-2 overflow-hidden rounded-full border border-vurgu/35 bg-linear-to-b from-vurgu/20 to-vurgu/5 py-1.5 pr-4 pl-3 shadow-vurgu">
          {/* Üstten geçen ince ışık — rozete "kazanılmış" hissi verir */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-vurgu-parlak to-transparent"
          />
          <AlevIkon className="size-4.5 text-vurgu" />
          <span className="font-baslik text-base leading-none font-bold tabular-nums text-vurgu-parlak">
            {seri.guncel}
          </span>
          <span className="text-xs leading-none text-vurgu/80">gün</span>
        </span>
      )}

      {seri.en_uzun > 0 && (
        <span className="rounded-full border border-cizgi bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-silik">
          en uzun <span className="tabular-nums text-soluk">{seri.en_uzun}</span>
        </span>
      )}
    </div>
  )
}
