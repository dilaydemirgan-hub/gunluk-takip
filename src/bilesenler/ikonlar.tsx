type Props = { className?: string }

const ortak = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/**
 * `cizili` verilirse tik çizgi boyunca çizilir/geri sarılır.
 * Verilmezse statik tik.
 */
export function TikIkon({ className, cizili }: Props & { cizili?: boolean }) {
  const animasyonlu = cizili !== undefined

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak} strokeWidth={3.2}>
      <path
        d="M5 12.5 10 17.5 19 7"
        pathLength={1}
        className={animasyonlu ? 'transition-[stroke-dashoffset] duration-300 ease-out' : undefined}
        style={
          animasyonlu ? { strokeDasharray: 1, strokeDashoffset: cizili ? 0 : 1 } : undefined
        }
      />
    </svg>
  )
}

export function AlevIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.9 2.2c.3 2.5-.6 4-1.9 5.4-1.4 1.5-3.2 3-3.2 5.9a6.2 6.2 0 0 0 12.4 0c0-3.4-2-5.4-3.6-7.4-.4 1-1.1 1.7-1.9 2 .5-2.4-.2-4.4-1.8-5.9Z"
        opacity=".9"
      />
      <path
        fill="currentColor"
        d="M12 13c.8 1 1.1 1.8 1.1 2.7a2.6 2.6 0 0 1-5.2 0c0-1.5 1-2.3 1.8-3.2.3.6.7 1 1.2 1.2-.1-1 .3-1.9 1.1-2.6Z"
        opacity=".45"
      />
    </svg>
  )
}

export function ArtiIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CopIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function YukariIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <path d="m6 14 6-6 6 6" />
    </svg>
  )
}

export function AsagiIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <path d="m6 10 6 6 6-6" />
    </svg>
  )
}

export function KopyaIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2" />
    </svg>
  )
}

export function PusulaIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.2 8.8-1.7 4.7-4.7 1.7 1.7-4.7z" />
    </svg>
  )
}

export function KapatIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...ortak}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
