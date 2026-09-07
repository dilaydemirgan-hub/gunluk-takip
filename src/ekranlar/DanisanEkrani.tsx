import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GecmisIzgara } from '../bilesenler/GecmisIzgara'
import { GorevSatiri } from '../bilesenler/GorevSatiri'
import { GunDetayi } from '../bilesenler/GunDetayi'
import { Kaydirici } from '../bilesenler/Kaydirici'
import { KesifArsivi } from '../bilesenler/KesifArsivi'
import { SeriRozeti } from '../bilesenler/SeriRozeti'
import { Gecersiz, Yukleniyor } from '../bilesenler/Durum'
import { RpcHata, gecmisGetir, gunGetir, gunKaydet, hataMesaji } from '../lib/api'
import { gorecelTarih, gunEkle, uzunTarih } from '../lib/tarih'
import { TUR_ADI, TUR_SIRASI, type Gecmis, type GunOzeti, type GunVerisi } from '../lib/tipler'

type Sekme = 'bugun' | 'gecmis' | 'kesif'

const SEKMELER: { anahtar: Sekme; ad: string }[] = [
  { anahtar: 'bugun', ad: 'Bugün' },
  { anahtar: 'gecmis', ad: 'Geçmiş' },
  { anahtar: 'kesif', ad: 'Keşif' },
]

export function DanisanEkrani() {
  const { kod = '' } = useParams()

  const [veri, setVeri] = useState<GunVerisi | null>(null)
  const [gecmis, setGecmis] = useState<Gecmis | null>(null)
  const [gecersiz, setGecersiz] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  const [sekme, setSekme] = useState<Sekme>('bugun')
  const [tarih, setTarih] = useState<string | undefined>(undefined)
  const [detay, setDetay] = useState<GunOzeti | null>(null)

  const [isaretler, setIsaretler] = useState<Record<string, boolean>>({})
  const [kaygi, setKaygi] = useState(5)
  const [kacinma, setKacinma] = useState(5)
  const [notMetni, setNotMetni] = useState('')

  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [kaydedildi, setKaydedildi] = useState(false)
  const zamanlayici = useRef<number | undefined>(undefined)

  /** gun_getir dönüşünü forma yansıt. */
  const doldur = useCallback((g: GunVerisi) => {
    setVeri(g)
    setIsaretler(Object.fromEntries(g.gorevler.map((x) => [x.id, x.yapildi])))
    setKaygi(g.gun.kaygi ?? 5)
    setKacinma(g.gun.kacinma ?? 5)
    setNotMetni(g.gun.not_metni ?? '')
  }, [])

  useEffect(() => {
    let gecerli = true

    Promise.all([gunGetir(kod, tarih), gecmisGetir(kod)])
      .then(([g, h]) => {
        if (!gecerli) return
        doldur(g)
        setGecmis(h)
        setHata(null)
      })
      .catch((e: unknown) => {
        if (!gecerli) return
        if (e instanceof RpcHata && e.kod === 'gecersiz_baglanti') setGecersiz(true)
        else setHata(hataMesaji(e))
      })

    return () => {
      gecerli = false
    }
  }, [kod, tarih, doldur])

  useEffect(() => () => clearTimeout(zamanlayici.current), [])

  const gruplar = useMemo(() => {
    if (!veri) return []
    return TUR_SIRASI.map((tur) => ({
      tur,
      gorevler: veri.gorevler.filter((g) => g.tur === tur),
    })).filter((grup) => grup.gorevler.length > 0)
  }, [veri])

  /** Dün doldurulmadıysa sessiz bir davet — uyarı değil. */
  const dunTeklifi = useMemo(() => {
    if (!veri || !gecmis) return null
    if (veri.tarih !== veri.bugun) return null
    const dun = gunEkle(veri.bugun, -1)
    const kayit = gecmis.gunler.find((g) => g.tarih === dun)
    return kayit && !kayit.gonderildi_at ? dun : null
  }, [veri, gecmis])

  async function kaydet() {
    if (!veri || kaydediliyor) return
    setKaydediliyor(true)
    setHata(null)

    try {
      const yeni = await gunKaydet(
        kod,
        veri.tarih,
        veri.gorevler.map((g) => ({ gorev_id: g.id, yapildi: isaretler[g.id] ?? false })),
        kaygi,
        kacinma,
        notMetni.trim() || null,
      )
      doldur(yeni)
      setGecmis(await gecmisGetir(kod))

      setKaydedildi(true)
      clearTimeout(zamanlayici.current)
      zamanlayici.current = window.setTimeout(() => setKaydedildi(false), 2200)
    } catch (e) {
      setHata(hataMesaji(e))
    } finally {
      setKaydediliyor(false)
    }
  }

  if (gecersiz) return <Gecersiz />
  if (!veri || !gecmis) {
    return hata ? <MerkezHata mesaj={hata} /> : <Yukleniyor />
  }

  const kilitli = !veri.yazilabilir

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-4 pt-9 pb-36">
      <header className="mb-6">
        <p className="text-[0.72rem] font-medium tracking-[0.14em] text-silik uppercase">
          {uzunTarih(veri.bugun)}
        </p>
        <h1 className="mt-1.5 text-[2rem] leading-[1.05] font-bold">
          Merhaba{' '}
          <span className="text-vurgu">{veri.gorunen_ad || veri.takma_ad}</span>
        </h1>
        <div className="mt-4">
          <SeriRozeti seri={veri.seri} />
        </div>
      </header>

      <nav className="mb-5 flex gap-1 rounded-2xl border border-cizgi bg-gece/50 p-1">
        {SEKMELER.map((s) => (
          <button
            key={s.anahtar}
            type="button"
            onClick={() => setSekme(s.anahtar)}
            className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
              sekme === s.anahtar
                ? 'bg-vurgu/12 text-vurgu ring-1 ring-vurgu/25 ring-inset'
                : 'text-silik hover:text-soluk'
            }`}
          >
            {s.ad}
          </button>
        ))}
      </nav>

      {sekme === 'bugun' && (
        <section className="animate-belir space-y-4">
          <div className="cam rounded-yumusak p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-baslik text-lg font-semibold">
                {gorecelTarih(veri.tarih, veri.bugun)}
              </h2>
              {veri.gun.gonderildi_at && (
                <span className="rounded-full border border-vurgu/25 px-2.5 py-1 text-[0.68rem] font-medium text-vurgu">
                  kaydedildi
                </span>
              )}
            </div>

            {gruplar.length === 0 ? (
              <p className="py-6 text-center text-sm leading-relaxed text-silik">
                Bugün için görev yok.
                <br />
                İstersen yine de gününü not edebilirsin.
              </p>
            ) : (
              <div className="space-y-4">
                {gruplar.map((grup) => (
                  <div key={grup.tur}>
                    <p className="mb-2.5 text-[0.68rem] font-semibold tracking-[0.12em] text-silik uppercase">
                      {TUR_ADI[grup.tur]}
                    </p>
                    <div className="space-y-2">
                      {grup.gorevler.map((g) => (
                        <GorevSatiri
                          key={g.id}
                          gorev={g}
                          kilitli={kilitli}
                          yapildi={isaretler[g.id] ?? false}
                          degistir={(y) => setIsaretler((o) => ({ ...o, [g.id]: y }))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cam space-y-4 rounded-yumusak p-5">
            <Kaydirici etiket="Kaygı" deger={kaygi} kilitli={kilitli} degistir={setKaygi} />
            <Kaydirici etiket="Kaçınma" deger={kacinma} kilitli={kilitli} degistir={setKacinma} />
          </div>

          <div className="cam rounded-yumusak p-5">
            <label htmlFor="not" className="text-sm font-medium text-soluk">
              Bugün aklımdan geçen cümle
            </label>
            <input
              id="not"
              type="text"
              value={notMetni}
              disabled={kilitli}
              maxLength={280}
              onChange={(e) => setNotMetni(e.target.value)}
              placeholder="Tek satır yeter."
              className="mt-2.5 w-full rounded-satir border border-cizgi bg-gece/50 px-4 py-3.5 text-[0.975rem] text-metin transition-colors placeholder:text-silik focus:border-vurgu focus:bg-gece/70 focus:outline-none disabled:opacity-50"
            />
          </div>

          {dunTeklifi && (
            <button
              type="button"
              onClick={() => setTarih(dunTeklifi)}
              className="w-full cursor-pointer py-1.5 text-center text-sm text-silik underline decoration-cizgi-parlak underline-offset-4 transition-colors hover:text-vurgu"
            >
              Dünü de doldur
            </button>
          )}

          {veri.tarih !== veri.bugun && (
            <button
              type="button"
              onClick={() => setTarih(undefined)}
              className="w-full cursor-pointer py-1.5 text-center text-sm text-silik underline decoration-cizgi-parlak underline-offset-4 transition-colors hover:text-vurgu"
            >
              Bugüne dön
            </button>
          )}
        </section>
      )}

      {sekme === 'gecmis' && (
        <section className="animate-belir space-y-4">
          <div className="cam rounded-yumusak p-5">
            <h2 className="mb-4 font-baslik text-lg font-semibold">Son 30 gün</h2>
            <GecmisIzgara gunler={gecmis.gunler} sec={setDetay} />
          </div>
        </section>
      )}

      {sekme === 'kesif' && (
        <section className="animate-belir">
          <KesifArsivi kartlar={gecmis.kesif_arsivi} />
        </section>
      )}

      {sekme === 'bugun' && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-linear-to-t from-zemin via-zemin/95 to-transparent pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-md px-4">
            {hata && <p className="mb-2.5 text-center text-sm text-soluk">{hata}</p>}
            <button
              type="button"
              onClick={kaydet}
              disabled={kaydediliyor || kilitli}
              className="w-full cursor-pointer rounded-satir bg-vurgu py-4 font-baslik text-base font-bold tracking-tight text-vurgu-uzeri shadow-vurgu transition-all duration-200 active:scale-[0.985] active:bg-vurgu-sonuk disabled:opacity-40 disabled:shadow-none"
            >
              {kaydediliyor ? 'Kaydediliyor…' : 'Günü kaydet'}
            </button>
          </div>
        </div>
      )}

      {kaydedildi && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center">
          <span className="animate-yukari rounded-full border border-vurgu/30 bg-yuzey-ust px-4 py-2 text-sm font-medium text-vurgu shadow-yuzen">
            Kaydedildi
          </span>
        </div>
      )}

      {detay && (
        <GunDetayi gun={detay} bugun={gecmis.bugun} kapat={() => setDetay(null)} />
      )}
    </div>
  )
}

function MerkezHata({ mesaj }: { mesaj: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <p className="text-center text-sm text-soluk">{mesaj}</p>
    </div>
  )
}
