import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Estos paquetes usan APIs nativas de Node (pdf.js + workers, canvas,
  // binarios de OCR/Excel). Si Next intenta empaquetarlos para el server
  // bundle, se rompen en runtime ("No se pudo leer el PDF"). Declararlos
  // como externos hace que se carguen con require() nativo.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "sharp", "xlsx"],
};

export default nextConfig;
