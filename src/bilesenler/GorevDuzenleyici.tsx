import { useState } from 'react'
import { hataMesaji, yGorevAta, yGorevKopyala } from '../lib/api'
import { gorecelTarih, gunEkle } from '../lib/tarih'
import { TUR_ADI, TUR_SIRASI, type Gorev, type Tur } from '../lib/tipler'
import { ArtiIkon, AsagiIkon, CopIkon, KapatIkon, KopyaIkon, YukariIkon } from './ikonlar'

type Taslak = { anahtar: string; id: string | null; tur: Tur; baslik: string }

let sayac = 0
const yeniAnahtar = () => `t${++sayac}`

const taslagaCevir = (gorevler: Gorev[]): Taslak[] =>
  gorevler.map((g) => ({ anahtar: yeniAnahtar(), id: g.id, tur: g.tur, baslik: g.baslik }))

type Props = {
  adminKod: string
  tarih: string
  bugun: string
  gorevler: Gorev[]
  kapat: () => void
  yenile: () => void
}

export function GorevDuzenleyici({ adminKod, tarih, bugun, gorevler, kapat, yenile }: Props) {
  const [taslaklar, setTaslaklar] = useState<Taslak[]>(() => taslagaCevir(gorevler))
  const [kaynak, setKaynak] = useState(() => gunEkle(tarih, -1))
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  function ekle() {
    setTaslaklar((o) => [...o, { anahtar: yeniAnahtar(), id: null, tur: 'davranis', baslik: '' }])
  }

  function guncelle(anahtar: string, alan: Partial<Taslak>) {
    setTaslaklar((o) => o.map((t) => (t.anahtar === anahtar ? { ...t, ...alan } : t)))
  }

  function sil(anahtar: string) {
    setTaslaklar((o) => o.filter((t) => t.anahtar !== anahtar))
  }

  function tasi(sira: number, yon: -1 | 1) {
    setTaslaklar((o) => {
      const hedef = sira + yon
      if (hedef < 0 || hedef >= o.length) return o
      const kopya = [...o]
      ;[kopya[sira], kopya[hedef]] = [kopya[hedef], kopya[sira]]
      return kopya
    })
  }

  async function kaydet() {
    setMesgul(true)
    setHata(null)
    try {
      const sonuc = await yGorevAta(
        adminKod,
        tarih,
        taslaklar
          .filter((t) => t.baslik.trim() !== '')
          .map((t) => ({ id: t.id, tur: t.tur, baslik: t.baslik.trim() })),
      )
      setTaslaklar(taslagaCevir(sonuc))
      yenile()
      kapat()
    } catch (e) {
      setHata(hataMesaji(e))
    } finally {
      setMesgul(false)
    }
  }

  async function kopyala() {
    setMesgul(true)
    setHata(null)
    try {
      const sonuc = await yGorevKopyala(adminKod, kaynak, tarih)
      setTaslaklar(taslagaCevir(sonuc))
      yenile()
    } catch (e) {
      setHata(hataMesaji(e))
    } finally {
      setMesgul(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Kapat"
        onClick={kapat}
        className="absolute inset-0 animate-belir bg-gece/75 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[88dvh] w-full max-w-lg animate-yukari flex-col rounded-t-[1.75rem] border border-cizgi bg-yuzey shadow-yuzen sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-3 border-b border-cizgi px-5 py-4">
          <div>
            <h2 className="font-baslik text-lg font-semibold">{gorecelTarih(tarih, bugun)}</h2>
            <p className="mt-1 text-xs text-silik">Görevleri düzenle</p>
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

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {taslaklar.length === 0 && (
            <p className="py-8 text-center text-sm text-silik">Bu günde görev yok.</p>
          )}

          {taslaklar.map((t, i) => (
            <div key={t.anahtar} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Yukarı taşı"
                  onClick={() => tasi(i, -1)}
                  disabled={i === 0}
                  className="cursor-pointer text-silik transition-colors hover:text-vurgu disabled:pointer-events-none disabled:opacity-25"
                >
                  <YukariIkon className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Aşağı taşı"
                  onClick={() => tasi(i, 1)}
                  disabled={i === taslaklar.length - 1}
                  className="cursor-pointer text-silik transition-colors hover:text-vurgu disabled:pointer-events-none disabled:opacity-25"
                >
                  <AsagiIkon className="size-4" />
                </button>
              </div>

              <select
                aria-label="Tür"
                value={t.tur}
                onChange={(e) => guncelle(t.anahtar, { tur: e.target.value as Tur })}
                className="cursor-pointer rounded-xl border border-cizgi bg-gece/50 px-2.5 py-2.5 text-sm text-metin focus:border-vurgu focus:outline-none"
              >
                {TUR_SIRASI.map((tur) => (
                  <option key={tur} value={tur}>
                    {TUR_ADI[tur]}
                  </option>
                ))}
              </select>

              <input
                aria-label="Görev başlığı"
                value={t.baslik}
                onChange={(e) => guncelle(t.anahtar, { baslik: e.target.value })}
                placeholder="Görev"
                className="min-w-0 flex-1 rounded-xl border border-cizgi bg-gece/50 px-3 py-2.5 text-sm text-metin placeholder:text-silik focus:border-vurgu focus:outline-none"
              />

              <button
                type="button"
                aria-label="Sil"
                onClick={() => sil(t.anahtar)}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-silik transition-colors hover:bg-white/5 hover:text-metin"
              >
                <CopIkon className="size-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={ekle}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-cizgi py-3 text-sm text-silik transition-colors hover:border-vurgu/40 hover:text-vurgu"
          >
            <ArtiIkon className="size-4" />
            Görev ekle
          </button>

          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-cizgi bg-gece/40 p-3.5">
            <span className="text-sm text-silik">Şu günden kopyala:</span>
            <input
              type="date"
              aria-label="Kaynak gün"
              value={kaynak}
              onChange={(e) => setKaynak(e.target.value)}
              className="rounded-lg border border-cizgi bg-yuzey px-2.5 py-1.5 text-sm text-metin focus:border-vurgu focus:outline-none"
            />
            <button
              type="button"
              onClick={kopyala}
              disabled={mesgul || !kaynak || kaynak === tarih}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-cizgi bg-yuzey-ust px-3 py-1.5 text-sm font-medium transition-colors hover:border-vurgu/40 hover:text-vurgu disabled:pointer-events-none disabled:opacity-40"
            >
              <KopyaIkon className="size-4" />
              Kopyala
            </button>
          </div>
        </div>

        <div className="border-t border-cizgi px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {hata && <p className="mb-2.5 text-sm text-soluk">{hata}</p>}
          <button
            type="button"
            onClick={kaydet}
            disabled={mesgul}
            className="w-full cursor-pointer rounded-2xl bg-vurgu py-3.5 font-baslik font-bold tracking-tight text-vurgu-uzeri shadow-vurgu transition-all duration-200 active:scale-[0.985] active:bg-vurgu-sonuk disabled:opacity-50"
          >
            {mesgul ? 'Kaydediliyor…' : 'Görevleri kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
