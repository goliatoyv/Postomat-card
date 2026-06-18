import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = '/Postomat-card/' потрібен для коректних шляхів на GitHub Pages
// (project pages віддаються з підкаталогу /<repo>/).
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/Postomat-card/' : '/',
})
