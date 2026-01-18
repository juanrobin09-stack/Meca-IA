import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Minification optimale
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en prod
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Code splitting optimisé
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks pour meilleur caching
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'animations': ['framer-motion'],
          'ui': ['lucide-react'],
        },
        // Asset naming pour cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Target moderne pour bundle plus petit
    target: 'es2020',
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps désactivés en prod pour sécurité
    sourcemap: false,
  },
  // Optimisations serveur dev
  server: {
    hmr: {
      overlay: true,
    },
  },
  // Optimisations de preview
  preview: {
    port: 4173,
  },
  // Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
    exclude: [],
  },
  // Esbuild optimizations
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
})
