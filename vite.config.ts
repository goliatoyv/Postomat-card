import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = '/Postomat-card/' потрібен для коректних шляхів на GitHub Pages
// (project pages віддаються з підкаталогу /<repo>/).
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/Postomat-card/' : '/',
  build: {
    rollupOptions: {
      // Стабільні (без хешу) імена файлів: навіть закешований index.html
      // завжди знаходить актуальні asset-и → жодного 404/«білого екрана»
      // через застарілий кеш GitHub Pages після частих деплоїв.
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
