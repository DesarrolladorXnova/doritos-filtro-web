import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// base './' hace que la página funcione en cualquier subcarpeta,
// como https://desarrolladorxnova.github.io/doritos-filtro-web/
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Página de pruebas Push-to-Web (no compartir con el cliente)
        dev: fileURLToPath(new URL('./dev.html', import.meta.url)),
      },
    },
  },
});
