import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths make the app work reliably on GitHub Pages
  // and later on an ETSU subdirectory or static hosting path.
  base: './',
  plugins: [react()],
});
