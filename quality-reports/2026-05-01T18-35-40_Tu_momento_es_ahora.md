# Quality Report — Tu momento es ahora

**Autor:** Victor Hugo Manzanilla
**Ejecutado:** 2026-05-01T18-35-40
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

Las cosas buenas no solo le suceden a los demás. El momento ha llegado. Es hora de que el éxito te suceda a ti. Este libro te guiará por un proceso de tres pasos sencillos cuya aplicación garantizan que alcances tus sueños y metas. El éxito es una ciencia y un arte a la vez. Por un lado, son principios que invariablemente te llevarán a acercarte a tus sueños. Por otro, es un arte, un proceso de descubrirte a ti mismo, y encontrar plenitud y significado para tu vida. Necesitas aprender ambos: el arte y la ciencia del éxito. Este libro te llevará por un proceso de tres pasos: 1. Conquistando lo interrno: Para tener éxito y lograr tus sueños (conquistar lo externo), primero necesitas conquistar lo interno. Debes aprender a reprogramar tu mente, conectar con tu...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- el arte y la ciencia del éxito
- conquistar lo interno antes de lo externo
- definir la visión y metas personales
- desarrollar hábitos para el éxito
- herramientas para alcanzar metas tangibles

**Key terms:** plenitud, autodescubrimiento, reprogramación mental, estructura integral, visión personal

**Voz autorial:** La voz de Victor Hugo Manzanilla es motivacional y empoderadora, guiando al lector a través de un proceso práctico y reflexivo hacia el éxito personal.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D2CF, accent=#D6A81F, ink=#1C1B17, contraste=11.40:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the specific concepts from the book, such as 'conquering the internal' and 'defining a vision,' which are key elements of the three-step process outlined in the ground truth. The phrases used are closely aligned with the book's themes of self-discovery and the art and science of success, making it highly specific to this book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely mirrors the specific concepts outlined in the ground truth, particularly the emphasis on 'conquering the internal' and 'defining a clear personal vision.' Phrases like 'reprogram your mind' and 'unlock your true potential' directly relate to the book's themes, making it highly specific to this work.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 11797
- Tiempo total: 49.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16624ms
- anchors: 2825 tokens, 8160ms
- palette: 0 tokens, 0ms
- content_es: 2985 tokens, 7496ms
- judge_es: 1362 tokens, 2265ms
- content_en: 2436 tokens, 9464ms
- judge_en: 1337 tokens, 3990ms
- voice: 852 tokens, 1316ms
- highlight_judge_es_parrafoTop: 649 tokens, 0ms
- highlight_judge_es_parrafoBot: 642 tokens, 0ms
- highlight_judge_en_parrafoTop: 639 tokens, 0ms
- highlight_judge_en_parrafoBot: 639 tokens, 0ms
