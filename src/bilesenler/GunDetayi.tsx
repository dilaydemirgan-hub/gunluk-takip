import { gorecelTarih, saat } from '../lib/tarih'
import { TUR_ADI, TUR_SIRASI, type GunOzeti } from '../lib/tipler'
import { KapatIkon, TikIkon } from './ikonlar'

type Props = {
  gun: GunOzeti
  bugun: string
  kapat: () => void
}

/** Geçmişteki bir kareye dokununca açılan, salt okunur alt panel. */
export function GunDetayi({ gun, bugun, kapat }: Props) {
  const doluGruplar = TUR_SIRASI.map((tur) => ({
    tur,
    gorevler: gun.gorevler.filter((g) => g.tur === tur),
  })).filter((grup) => grup.gorevler.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Kapat"
        onClick={kapat}
        className="absolute inset-0 animate-belir bg-gece/75 backdrop-blur-sm"
      />

      <div className="relative max-h-[82dvh] w-full max-w-md animate-yukari overflow-y-auto rounded-t-[1.75rem] border border-cizgi bg-yuzey p-5 pb-8 shadow-yuzen sm:rounded-[1.75rem] sm:pb-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="font-baslik text-lg font-semibold">
              {gorecelTarih(gun.tarih, bugun)}
            </p>
            {gun.gonderildi_at && (
              <p className="mt-1 text-xs text-silik">
                {saat(gun.gonderildi_at)}'de kaydedildi
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="-mt-1 -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-silik transition-colors hover:bg-white/5 hover:text-metin"
          >
            <KapatIkon className="size-5" />
          </button>
        </div>

        {doluGruplar.length === 0 && !gun.gonderildi_at ? (
          <p className="py-8 text-center text-sm text-silik">Bu güne dair kayıt yok.</p>
        ) : (
          <div className="space-y-5">
            {doluGruplar.map((grup) => (
              <div key={grup.tur}>
                <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.12em] text-silik uppercase">
                  {TUR_ADI[grup.tur]}
                </p>
                <ul className="space-y-2">
                  {grup.gorevler.map((g) => (
                    <li key={g.id} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-px grid size-5 shrink-0 place-items-center rounded-md ${
                          g.yapildi
                            ? 'bg-vurgu text-vurgu-uzeri'
                            : 'border border-cizgi text-transparent'
                        }`}
                      >
                        <TikIkon className="size-3" />
                      </span>
                      <span className={g.yapildi ? 'text-metin' : 'text-silik'}>{g.baslik}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {(gun.kaygi !== null || gun.kacinma !== null) && (
              <div className="flex gap-2.5">
                {gun.kaygi !== null && <Olcum etiket="Kaygı" deger={gun.kaygi} />}
                {gun.kacinma !== null && <Olcum etiket="Kaçınma" deger={gun.kacinma} />}
              </div>
            )}

            {gun.not_metni && (
              <p className="rounded-2xl border border-cizgi bg-white/[0.025] px-4 py-3.5 text-sm leading-relaxed text-soluk italic">
                “{gun.not_metni}”
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Olcum({ etiket, deger }: { etiket: string; deger: number }) {
  return (
    <span className="flex-1 rounded-2xl border border-cizgi bg-white/[0.025] px-4 py-3">
      <span className="block text-xs text-silik">{etiket}</span>
      <span className="font-baslik text-xl font-bold tabular-nums text-metin">{deger}</span>
    </span>
  )
}
