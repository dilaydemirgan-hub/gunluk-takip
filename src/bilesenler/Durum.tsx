export function Yukleniyor() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-cizgi border-t-vurgu"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  )
}

/** Kod yoksa/yanlışsa gösterilen nötr ekran. Başka hiçbir giriş yok. */
export function Gecersiz() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="animate-belir text-center">
        <div className="mx-auto mb-6 size-12 rounded-2xl border border-cizgi bg-white/[0.03]" />
        <p className="font-baslik text-xl font-semibold">Bağlantı geçersiz</p>
        <p className="mt-2 text-sm text-silik">Bu adres artık çalışmıyor olabilir.</p>
      </div>
    </div>
  )
}

export function Yapilandirilmadi() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-baslik text-xl font-semibold">Kurulum tamamlanmadı</p>
        <p className="mt-3 text-sm leading-relaxed text-soluk">
          <Kod>.env</Kod> içine <Kod>VITE_SUPABASE_URL</Kod> ve{' '}
          <Kod>VITE_SUPABASE_ANON_KEY</Kod> yaz, sonra sunucuyu yeniden başlat.
        </p>
      </div>
    </div>
  )
}

function Kod({ children }: { children: string }) {
  return (
    <code className="rounded-md border border-cizgi bg-white/[0.04] px-1.5 py-0.5 text-[0.8em] text-vurgu">
      {children}
    </code>
  )
}
