import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/*
  Configuracion de Vitest.
  - resolve.tsconfigPaths resuelve el alias "@/..." igual que Next.
  - Node sigue siendo el entorno por defecto para tests de logica pura.
  - Los tests de componentes optan a jsdom por archivo con @vitest-environment.
*/
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: true,
  },
});
