import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://<kullanici>.github.io/gunluk-takip/
// Repo adını değiştirirsen burayı da değiştir.
export default defineConfig({
  base: '/gunluk-takip/',
  plugins: [react(), tailwindcss()],
})
