# Quality Report — El poder del instinto

**Autor:** Leslie Zane
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Desafía las ideas convencionales del marketingy aprende cómo acceder al cerebro oculto de tu clientepara crear una red de conexiones que impulse a laspersonas a comprar tu producto, empresa o visión. Las personas no toman decisiones con la mente consciente, sino por instinto. En este libro, la consultora de marketing y experta en ciencias del comportamiento, Leslie Zane, demuestra que las tácticas de persuasión tradicionales son insuficientes para convencer a los consumidores. Si logras descifrar la red oculta de conexiones que regula las decisiones rápidas que tomamos, podrás conectar con la mente instintiva e influir en ella. Con un conjunto revolucionario de reglas para expandir la red, Zane nos muestra cómo hacer que cualquier idea, marca, negocio, cand...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- las decisiones se toman por instinto, no por la mente consciente
- la red oculta de conexiones que regula decisiones rápidas
- tácticas de persuasión tradicionales son insuficientes
- la importancia de encontrar nuevos clientes para el crecimiento
- historias que apelan a emociones no son suficientes para lealtad a largo plazo

**Key terms:** cerebro oculto, decisiones instintivas, red de conexiones, persuasión, crecimiento

**Voz autorial:** La voz de Leslie Zane es directa y desafiante, ofreciendo un enfoque innovador y basado en la ciencia sobre el marketing, con un estilo accesible que mezcla teoría con ejemplos prácticos.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado refleja de manera precisa conceptos clave del libro, como la idea de que las decisiones de compra son guiadas por el instinto y la importancia de comprender la red de conexiones en el cerebro oculto del consumidor. Frases como 'las decisiones se toman por instinto' y 'las tácticas de persuasión tradicionales son insuficientes' están directamente alineadas con la sinopsis del 

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the book's themes, specifically discussing how instinct drives buying decisions and the inadequacy of traditional persuasion tactics. It uses specific concepts such as 'hidden brain' and 'network of connections,' which are central to Leslie Zane's arguments in 'El poder del instinto.' This specificity indicates a strong grounding in the book's content.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el contenido del libro.
- EN: pagina — Voz directa y enfoque en el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.95**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10009
- Tiempo total: 29.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4665ms
- anchors: 2490 tokens, 6436ms
- palette: 0 tokens, 0ms
- content_es: 2658 tokens, 6646ms
- judge_es: 1007 tokens, 3625ms
- content_en: 2083 tokens, 5262ms
- judge_en: 967 tokens, 1931ms
- voice: 804 tokens, 918ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoBot: 642 tokens, 0ms
- highlight_judge_en_parrafoTop: 635 tokens, 0ms
- highlight_judge_en_parrafoBot: 638 tokens, 0ms
