import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,

        // 🔥 PERMITIR CUALQUIER HOST (Cloudflare, ngrok, etc.)
        allowedHosts: 'all',

        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
})
