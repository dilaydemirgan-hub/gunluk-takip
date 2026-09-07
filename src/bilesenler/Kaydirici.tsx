type Props = {
  etiket: string
  deger: number
  kilitli: boolean
  degistir: (deger: number) => void
}

export function Kaydirici({ etiket, deger, kilitli, degistir }: Props) {
  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between">
        <label htmlFor={`kaydirici-${etiket}`} className="text-sm font-medium text-soluk">
          {etiket}
        </label>
        <span className="font-baslik text-xl leading-none font-bold tabular-nums text-vurgu">
          {deger}
        </span>
      </div>
      <input
        id={`kaydirici-${etiket}`}
        type="range"
        min={0}
        max={10}
        step={1}
        value={deger}
        disabled={kilitli}
        onChange={(e) => degistir(Number(e.target.value))}
        className="kaydirici disabled:opacity-50"
      />
      <div className="flex justify-between px-0.5 text-[0.7rem] text-silik">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  )
}
