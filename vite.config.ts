import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // our actual HTML entry lives under `src/app`, so make that the project
  // root. the default output directory is relative to the root, so if we
  // didn't adjust `outDir` the built files would end up in
  // `src/app/dist` – push them back to the workspace root instead.
  root: path.resolve(__dirname, 'src/app'),

  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory. keep this pointed at the top‑level
      // `src` in case any future code imports things outside of `app`.
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
