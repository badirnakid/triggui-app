# Quality Report — La biología de la creencia

**Autor:** Bruce H. Lipton, Concepción Rodríguez González
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `openlibrary`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
INFORMACIÓN (OpenLibrary):

Libro verificado en OpenLibrary. Publicado originalmente en 2021.

METADATA VERIFICADA:
- Título: La biología de la creencia
- Autor: Bruce H. Lipton, Concepción Rodríguez González
- Año: 2021
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- los genes no controlan nuestra biología
- las señales externas influyen en nuestra salud
- el poder de los pensamientos en la biología

**Key terms:** biología, creencias, epigenética, pensamiento positivo, energía

**Voz autorial:** La voz de Lipton es accesible y persuasiva, combinando ciencia con un enfoque espiritual y motivacional.

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
- Razón: The content directly reflects key concepts from 'La biología de la creencia', such as the influence of beliefs on biology and health, which are central themes in Bruce H. Lipton's work. Phrases like 'las creencias moldean nuestra realidad biológica' and 'cada pensamiento es una señal' are specific to the book's premise, demonstrating a clear connection to its core ideas.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects key concepts from 'La biología de la creencia', emphasizing the influence of beliefs on biology and health, which are central themes in the book. Phrases like 'beliefs shape our biology' and 'thoughts create reality' are specific to Lipton's work.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en el contenido del libro.
- EN: pagina — Voz directa y enfoque en la experiencia personal.

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
- Tokens totales: 8286
- Tiempo total: 45.5s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17314ms
- anchors: 2128 tokens, 5747ms
- palette: 0 tokens, 0ms
- content_es: 2278 tokens, 9451ms
- judge_es: 678 tokens, 1983ms
- content_en: 1730 tokens, 7455ms
- judge_en: 658 tokens, 2179ms
- voice: 814 tokens, 1203ms
- highlight_judge_es_parrafoTop: 647 tokens, 0ms
- highlight_judge_es_parrafoBot: 637 tokens, 0ms
- highlight_judge_en_parrafoTop: 640 tokens, 0ms
- highlight_judge_en_parrafoBot: 635 tokens, 0ms
