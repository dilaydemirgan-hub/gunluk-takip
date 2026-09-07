import { useEffect, useState } from 'react'
import type { Gorev } from '../lib/tipler'
import { TikIkon } from './ikonlar'

type Props = {
  gorev: Gorev
  yapildi: boolean
  kilitli: boolean
  degistir: (yapildi: boolean) => void
}

export function GorevSatiri({ gorev, yapildi, kilitli, degistir }: Props) {
  const [zipla, setZipla] = useState(false)

  useEffect(() => {
    if (!zipla) return
    const t = setTimeout(() => setZipla(false), 700)
    return () => clearTimeout(t)
  }, [zipla])

  function tikla() {
    if (kilitli) return
    if (!yapildi) setZipla(true)
    degistir(!yapildi)
  }

  return (
    <button
      type="button"
      onClick={tikla}
      disabled={kilitli}
      aria-pressed={yapildi}
      className={`flex min-h-15 w-full items-center gap-3.5 rounded-satir border px-4 py-3 text-left transition-all duration-300 ${
        yapildi
          ? 'border-vurgu/30 bg-vurgu-zemin'
          : 'border-cizgi bg-white/[0.025] active:border-cizgi-parlak active:bg-white/5'
      } ${kilitli ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
    >
      <span className="relative grid shrink-0 place-items-center">
        {/* İşaretlenince dışa doğru dağılan halka */}
        {zipla && (
          <span
            aria-hidden="true"
            className="absolute size-7 animate-halka rounded-[0.7rem] bg-vurgu"
          />
        )}

        <span
          className={`relative grid size-7 place-items-center rounded-[0.7rem] border-2 transition-colors duration-300 ${
            yapildi
              ? 'border-vurgu bg-vurgu text-vurgu-uzeri shadow-vurgu'
              : 'border-cizgi-parlak bg-gece/40 text-transparent'
          } ${zipla ? 'animate-onay' : ''}`}
        >
          <TikIkon className="size-4" cizili={yapildi} />
        </span>
      </span>

      <span
        className={`text-[0.975rem] leading-snug transition-colors duration-300 ${
          yapildi ? 'font-medium text-vurgu-parlak' : 'text-metin'
        }`}
      >
        {gorev.baslik}
      </span>
    </button>
  )
}
