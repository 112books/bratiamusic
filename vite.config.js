import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/bratiamusic/',  // <-- Esta línea es la clave
  build: {
    outDir: 'dist'
  }
})