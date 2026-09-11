// @ts-check
import { defineConfig } from 'astro/config'

export default defineConfig({
  // Sitio estático: `npm run build` deja HTML plano en dist/.
  // La navegación entre páginas la hace <ClientRouter /> en el cliente.
  build: {
    // URLs limpias: /home en lugar de /home.html.
    format: 'directory',
  },
})
