// resize-icon.js
import sharp from "sharp";

const inputPath = "./assets/adaptive-icon.png";
const outputPath = "./assets/adaptive-icon.png"; // sobrescribe la original

sharp(inputPath)
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 } // fondo blanco (puedes cambiarlo)
  })
  .toFile(outputPath)
  .then(() => {
    console.log("✅ adaptive-icon.png redimensionado a 1024x1024 correctamente.");
  })
  .catch(err => {
    console.error("❌ Error al redimensionar:", err);
  });
