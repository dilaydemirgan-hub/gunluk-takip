import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anahtar = import.meta.env.VITE_SUPABASE_ANON_KEY

/** .env doldurulmadıysa uygulama çökmek yerine kurulum ekranı gösterir. */
export const yapilandirildi = Boolean(url && anahtar)

export const supabase = createClient(
  url || 'https://yapilandirilmadi.supabase.co',
  anahtar || 'yapilandirilmadi',
  { auth: { persistSession: false, autoRefreshToken: false } },
)
