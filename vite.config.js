import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // if 5173 is taken, try next available
    open: true,        // auto-opens browser when you run npm run dev
  },
})
