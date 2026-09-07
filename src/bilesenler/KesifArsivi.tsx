import { kisaTarih } from '../lib/tarih'
import type { KesifKarti } from '../lib/tipler'
import { PusulaIkon } from './ikonlar'

/** Tamamlanmış keşif görevleri koleksiyon gibi birikir. */
export function KesifArsivi({ kartlar }: { kartlar: KesifKarti[] }) {
  if (kartlar.length === 0) {
    return (
      <div className="rounded-yumusak border border-dashed border-cizgi px-6 py-14 text-center">
        <PusulaIkon className="mx-auto mb-3 size-7 text-cizgi-parlak" />
        <p className="text-sm text-silik">
          Tamamladığın keşif görevleri burada birikecek.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3.5 text-sm text-silik">
        <span className="font-baslik font-bold tabular-nums text-vurgu">{kartlar.length}</span>{' '}
        keşif
      </p>

      <div className="grid grid-cols-2 gap-3">
        {kartlar.map((kart, i) => (
          <article
            key={`${kart.tarih}-${i}`}
            className="relative animate-yukari overflow-hidden rounded-2xl border border-vurgu/20 bg-linear-to-b from-vurgu/10 to-white/[0.02] p-4 shadow-kart"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-vurgu/50 to-transparent"
            />
            <PusulaIkon className="mb-2.5 size-4 text-vurgu" />
            <p className="text-sm leading-snug font-medium text-metin">{kart.baslik}</p>
            <p className="mt-2.5 text-[0.7rem] text-silik">{kisaTarih(kart.tarih)}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
