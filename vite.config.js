import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2017', // Modern target for better optimization
    minify: 'esbuild', // Fastest minifier (default)
    sourcemap: false,  // No source maps in production for faster builds
    chunkSizeWarningLimit: 600, // Warn if a chunk is >600kb
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-select'], // Pre-bundle these for dev speed
  },
  server: {
    open: true, // Opens browser automatically in dev
    strictPort: true, // Fail if port is in use
  },
})