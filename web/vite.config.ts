import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Permite importar com "@/..." a partir de src/ (mesmo mapeamento do tsconfig.app.json)
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Em dev, /api vai para o Nest. Front e API ficam na mesma origem
    // (localhost:5173), então o cookie de sessão funciona sem CORS,
    // igual a produção (onde o Caddy faz esse papel).
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        xfwd: true,
      },
    },
  },
})
