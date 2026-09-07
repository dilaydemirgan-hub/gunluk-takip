import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Gecersiz, Yukleniyor } from '../bilesenler/Durum'
import { GorevDuzenleyici } from '../bilesenler/GorevDuzenleyici'
import { KopyaIkon } from '../bilesenler/ikonlar'
import { RpcHata, hataMesaji, yOzet } from '../lib/api'
import { gorecelTarih, saat, uzunTarih } from '../lib/tarih'
import type { GunOzeti, Ozet } from '../lib/tipler'

export function TerapistEkrani() {
  const { adminKod = '' } = useParams()

  const [ozet, setOzet] = useState<Ozet | null>(null)
  const [gecersiz, setGecersiz] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [secili, setSecili] = useState<string | null>(null)
  const [gunSecici, setGunSecici] = useState('')
  const [kopyalandi, setKopyalandi] = useState(false)

  const yukle = useCallback(() => {
    yOzet(adminKod)
      .then((o) => {
        setOzet(o)
        setHata(null)
      })
      .catch((e: unknown) => {
        if (e instanceof RpcHata && e.kod === 'gecersiz_baglanti') setGecersiz(true)
        else setHata(hataMesaji(e))
      })
  }, [adminKod])

  useEffect(yukle, [yukle])

  if (gecersiz) return <Gecersiz />
  if (!ozet) {
    return hata ? (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-soluk">{hata}</p>
      </div>
    ) : (
      <Yukleniyor />
    )
  }

  const danisanBaglantisi = `${location.origin}${import.meta.env.BASE_URL}#/a/${ozet.kod}`
  const seciliGun = ozet.gunler.find((g) => g.tarih === secili)

  async function baglantiKopyala() {
    try {
      await navigator.clipboard.writeText(danisanBaglantisi)
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 1800)
    } catch {
      setHata('Bağlantı kopyalanamadı, elle seç.')
    }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-4xl px-4 py-9 sm:px-6">
      <header className="mb-7">
        <p className="text-[0.72rem] font-medium tracking-[0.14em] text-silik uppercase">
          {uzunTarih(ozet.bugun)}
        </p>
        <h1 className="mt-1.5 text-[2rem] leading-[1.05] font-bold">{ozet.takma_ad}</h1>
        {ozet.gorunen_ad && (
          <p className="mt-1.5 text-sm text-silik">
            Danışan ekranında görünen ad:{' '}
            <span className="text-vurgu">{ozet.gorunen_ad}</span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-xl border border-cizgi bg-gece/50 px-3 py-2.5 text-xs text-silik">
            {danisanBaglantisi}
          </code>
          <button
            type="button"
            onClick={baglantiKopyala}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cizgi bg-yuzey-ust px-3.5 py-2.5 text-sm font-medium transition-colors hover:border-vurgu/40 hover:text-vurgu"
          >
            <KopyaIkon className="size-4" />
            {kopyalandi ? 'Kopyalandı' : 'Danışan bağlantısı'}
          </button>
        </div>
      </header>

      <div className="cam mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl p-3.5">
        <label htmlFor="gun-sec" className="text-sm text-silik">
          Başka bir güne görev ata:
        </label>
        <input
          id="gun-sec"
          type="date"
          value={gunSecici || ozet.bugun}
          onChange={(e) => setGunSecici(e.target.value)}
          className="cursor-pointer rounded-lg border border-cizgi bg-gece/50 px-2.5 py-1.5 text-sm text-metin focus:border-vurgu focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setSecili(gunSecici || ozet.bugun)}
          className="cursor-pointer rounded-lg border border-vurgu/30 bg-vurgu/10 px-3.5 py-1.5 text-sm font-medium text-vurgu transition-colors hover:bg-vurgu/20"
        >
          Aç
        </button>
      </div>

      {hata && <p className="mb-3 text-sm text-soluk">{hata}</p>}

      <div className="cam overflow-x-auto rounded-yumusak">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cizgi text-left text-[0.68rem] tracking-[0.12em] text-silik uppercase">
              <th className="px-4 py-3 font-semibold">Tarih</th>
              <th className="px-4 py-3 font-semibold">Görev</th>
              <th className="px-4 py-3 font-semibold">Kaygı</th>
              <th className="px-4 py-3 font-semibold">Kaçınma</th>
              <th className="px-4 py-3 font-semibold">Not</th>
              <th className="px-4 py-3 font-semibold">Gönderim</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {ozet.gunler.map((gun) => (
              <Satir
                key={gun.tarih}
                gun={gun}
                bugun={ozet.bugun}
                duzenle={() => setSecili(gun.tarih)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {secili && (
        <GorevDuzenleyici
          key={secili}
          adminKod={adminKod}
          tarih={secili}
          bugun={ozet.bugun}
          gorevler={seciliGun?.gorevler ?? []}
          kapat={() => setSecili(null)}
          yenile={yukle}
        />
      )}
    </div>
  )
}

function Satir({
  gun,
  bugun,
  duzenle,
}: {
  gun: GunOzeti
  bugun: string
  duzenle: () => void
}) {
  // Boş gün burada net görünsün — danışan tarafının aksine.
  const bos = gun.toplam === 0 && !gun.gonderildi_at
  const gelecek = gun.tarih > bugun

  return (
    <tr
      className={`border-b border-cizgi/60 transition-colors last:border-0 hover:bg-white/[0.025] ${
        bos ? 'bg-gece/40' : ''
      }`}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={gun.tarih === bugun ? 'font-baslik font-bold text-vurgu' : ''}>
          {gorecelTarih(gun.tarih, bugun)}
        </span>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {gun.toplam === 0 ? (
          <span className="text-silik">—</span>
        ) : (
          <span className="tabular-nums">
            <span
              className={`font-semibold ${
                gun.tamamlanan === gun.toplam ? 'text-vurgu' : 'text-metin'
              }`}
            >
              {gun.tamamlanan}
            </span>
            <span className="text-silik">/{gun.toplam}</span>
          </span>
        )}
      </td>

      <td className="px-4 py-3 tabular-nums">
        {gun.kaygi ?? <span className="text-silik">—</span>}
      </td>
      <td className="px-4 py-3 tabular-nums">
        {gun.kacinma ?? <span className="text-silik">—</span>}
      </td>

      <td className="max-w-xs px-4 py-3">
        {gun.not_metni ? (
          <span className="line-clamp-2 text-soluk italic">“{gun.not_metni}”</span>
        ) : (
          <span className="text-silik">—</span>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
        {gun.gonderildi_at ? (
          <span className="text-soluk">{saat(gun.gonderildi_at)}</span>
        ) : gelecek ? (
          <span className="text-silik">—</span>
        ) : (
          // Boş gün burada net görünsün — danışan tarafının aksine.
          <span className="rounded-md bg-white/5 px-2 py-1 text-[0.7rem] text-silik">boş</span>
        )}
      </td>

      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={duzenle}
          className="cursor-pointer rounded-lg border border-cizgi px-3 py-1.5 text-xs font-medium text-soluk transition-colors hover:border-vurgu/40 hover:text-vurgu"
        >
          Görevler
        </button>
      </td>
    </tr>
  )
}
