import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: ruta donde se publica en GitHub Pages (https://<usuario>.github.io/crasher00/).
// "./" funciona tanto ahí como abriendo la app en local con `npm run preview`.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
