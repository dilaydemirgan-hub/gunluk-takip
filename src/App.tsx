import { HashRouter, Route, Routes } from 'react-router-dom'
import { Gecersiz, Yapilandirilmadi } from './bilesenler/Durum'
import { DanisanEkrani } from './ekranlar/DanisanEkrani'
import { TerapistEkrani } from './ekranlar/TerapistEkrani'
import { yapilandirildi } from './lib/supabase'

/**
 * GitHub Pages sunucu tarafı yönlendirme yapamadığı için HashRouter.
 * Kod dışında hiçbir giriş yolu yok: tanınmayan her adres nötr ekran.
 */
export default function App() {
  if (!yapilandirildi) return <Yapilandirilmadi />

  return (
    <HashRouter>
      <Routes>
        <Route path="/a/:kod" element={<DanisanEkrani />} />
        <Route path="/y/:adminKod" element={<TerapistEkrani />} />
        <Route path="*" element={<Gecersiz />} />
      </Routes>
    </HashRouter>
  )
}
