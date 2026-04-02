const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../public/lab/ediciones.json');
const OUT_DIR = path.join(__dirname, '../public/lab/t');

async function buildOgImages() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No se encontró ediciones.json');
    return;
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const ediciones = data.ediciones || [];

  console.log('Iniciando generador de OG Images Nivel Dios (Modo Incremental)...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 }); 

  let generadas = 0;
  let saltadas = 0;

  for (const edicion of ediciones) {
    if (!edicion.id) continue;

    const dir = path.join(OUT_DIR, edicion.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const outPath = path.join(dir, 'og.png');

    // MODO INCREMENTAL: Si ya existe, no perdemos tiempo
    if (fs.existsSync(outPath)) {
      saltadas++;
      continue;
    }

    // Extraemos los datos del libro
    const titulo = edicion.tarjeta?.titulo || edicion.titulo || '';
    const hook = edicion.tarjeta?.subtitulo || edicion.tagline || ''; 
    const portada = edicion.portada || '';
    const palabras = edicion.palabras || ['movimiento', 'corazón', 'cerebro', 'integración'];
    const emojis = ['🛡️', '✨', '🧠', '🌊'];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Archivo:wght@500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 1200px; height: 630px;
            background: #F4F1EA;
            font-family: 'Archivo', sans-serif;
            display: flex;
            position: relative;
            overflow: hidden;
          }
          
          body::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
            mix-blend-mode: multiply;
            opacity: 0.25;
            pointer-events: none;
            z-index: 0;
          }

          .content-left {
            width: 60%;
            padding: 80px 60px 80px 80px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 2;
          }

          .title {
            font-family: 'Playfair Display', serif;
            font-size: 72px;
            line-height: 1.1;
            color: #111;
            margin-bottom: 30px;
            font-weight: 800;
            letter-spacing: -1.5px;
          }

          .hook-box {
            background: rgba(0,0,0,0.04);
            border-left: 8px solid #111;
            padding: 24px 30px;
            font-size: 32px;
            font-weight: 600;
            color: #222;
            line-height: 1.4;
            border-radius: 0 16px 16px 0;
          }

          .book-right {
            width: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: 2000px;
            z-index: 2;
          }

          .book-3d {
            width: 300px;
            height: 460px;
            background-image: url('${portada}');
            background-size: cover;
            background-position: center;
            border-radius: 4px 12px 12px 4px;
            transform: rotateY(-25deg) rotateX(5deg) translateZ(0);
            box-shadow: 
              -35px 35px 50px rgba(0,0,0,0.25),
              inset 4px 0 15px rgba(255,255,255,0.5);
            position: relative;
          }

          .book-3d::before {
            content: '';
            position: absolute;
            top: 0; left: -24px;
            width: 24px; height: 100%;
            background: #E0E0E0;
            transform-origin: right;
            transform: rotateY(-90deg);
            border-radius: 6px 0 0 6px;
            background-image: linear-gradient(to right, #bbb 0%, #ddd 20%, #ccc 100%);
          }

          .book-3d::after {
            content: '';
            position: absolute;
            top: 4px; right: -16px;
            width: 16px; height: 98%;
            background: #fff;
            transform-origin: left;
            transform: rotateY(90deg);
            border-radius: 0 6px 6px 0;
            background-image: repeating-linear-gradient(to bottom, #ddd 0px, #fff 2px);
          }

          .dna-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: #111;
            display: flex;
            align-items: center;
            padding: 0 80px;
            gap: 40px;
            z-index: 5;
          }

          .dna-item {
            color: #fff;
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            text-transform: lowercase;
            opacity: 0.9;
          }

          .logo-triggui {
            margin-left: auto;
            height: 24px;
            filter: invert(1);
          }
        </style>
      </head>
      <body>
        <div class="content-left">
          <div class="title">${titulo}</div>
          <div class="hook-box">${hook}</div>
        </div>
        <div class="book-right">
          <div class="book-3d"></div>
        </div>
        <div class="dna-bar">
          <div class="dna-item">${emojis[0]} ${palabras[0]}</div>
          <div class="dna-item">${emojis[1]} ${palabras[1]}</div>
          <div class="dna-item">${emojis[2]} ${palabras[2]}</div>
          <div class="dna-item">${emojis[3]} ${palabras[3]}</div>
          <img class="logo-triggui" src="https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletras2.png" />
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`[GENERADA] Nueva OG Image creada: ${edicion.id}/og.png`);
    generadas++;
  }

  await browser.close();
  console.log(`\n¡Proceso terminado! Generadas: ${generadas} | Saltadas: ${saltadas}`);
}

buildOgImages().catch(console.error);