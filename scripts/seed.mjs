#!/usr/bin/env node
/**
 * Bir danışan kaydı oluşturur ve kodları konsola basar.
 *
 * Gerekli (.env.local içine koy, git'e girmez):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...        (Dashboard → Settings → API)
 *
 * Kullanım:  npm run seed -- "Takma Ad"
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function envYukle(dosya) {
  try {
    for (const satir of readFileSync(dosya, 'utf8').split('\n')) {
      const eslesme = satir.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!eslesme) continue
      const deger = eslesme[2].replace(/^["']|["']$/g, '')
      if (deger && !process.env[eslesme[1]]) process.env[eslesme[1]] = deger
    }
  } catch {
    /* dosya yoksa sorun değil */
  }
}

envYukle('.env.local')
envYukle('.env')

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const servisAnahtari = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !servisAnahtari) {
  console.error(
    '\n.env.local içine şunları yaz:\n' +
      '  SUPABASE_URL=https://xxxx.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=...   (Dashboard → Settings → API → service_role)\n',
  )
  process.exit(1)
}

const ALFABE = 'abcdefghjkmnpqrstuvwxyz23456789'

function kodUret(uzunluk) {
  const bayt = new Uint8Array(uzunluk)
  globalThis.crypto.getRandomValues(bayt)
  return Array.from(bayt, (b) => ALFABE[b % ALFABE.length]).join('')
}

const takmaAd = process.argv[2] || 'Danışan'
const supabase = createClient(url, servisAnahtari, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase
  .from('danisan')
  .insert({ takma_ad: takmaAd, kod: kodUret(10), admin_kod: kodUret(14) })
  .select('takma_ad, kod, admin_kod')
  .single()

if (error) {
  console.error('\nEklenemedi:', error.message)
  console.error('supabase.sql dosyasını çalıştırdın mı?\n')
  process.exit(1)
}

const taban = process.env.SITE_URL || 'http://localhost:5173/gunluk-takip/'

console.log(`
  Danışan oluşturuldu: ${data.takma_ad}

  kod        ${data.kod}
  admin_kod  ${data.admin_kod}

  Danışan   ${taban}#/a/${data.kod}
  Terapist  ${taban}#/y/${data.admin_kod}
`)
