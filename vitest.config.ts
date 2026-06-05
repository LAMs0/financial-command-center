import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/*
  Configuración de Vitest.
  - tsconfigPaths: resuelve el alias "@/..." igual que Next (lee tsconfig.json).
  - environment "node": las funciones bajo test son puras / de servidor; no
    necesitan DOM. Los componentes React no se testean aquí (se cubren con
    type-check + verificación manual).
*/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
});
