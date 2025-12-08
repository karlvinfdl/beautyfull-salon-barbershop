import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/beautyfull-salon-barbershop/',

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        rdv: resolve(__dirname, 'pages/rendez-vous.html'),
        admin: resolve(__dirname, 'pages/admin.html'),
      }
    }
  }
});
