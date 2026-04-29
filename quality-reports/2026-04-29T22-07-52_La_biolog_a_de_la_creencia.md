# Quality Report — La biología de la creencia

**Autor:** Bruce H. Lipton, Concepción Rodríguez González
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `openlibrary`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_3sources
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
- las señales externas influyen en la expresión genética
- el poder de los pensamientos en la salud celular

**Key terms:** epigenética, biología celular, pensamiento positivo, mensajes energéticos, control biológico

**Voz autorial:** La voz autorial es accesible y persuasiva, buscando conectar conceptos científicos complejos con el entendimiento del lector común.

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
- Razón: The content directly references key concepts from 'La biología de la creencia', such as the influence of thoughts on cellular health and the role of epigenetics in determining health outcomes. Phrases like 'los pensamientos moldean tu salud' and 'las señales externas son las claves de tu expresión genética' are specific to the book's themes, demonstrating a clear connection to its core ideas.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly references key concepts from 'La biología de la creencia', such as the influence of thoughts on cellular health and genetic expression, which are central themes in the book. Phrases like 'epigenetics' and 'beliefs shape our biology' are specific to Lipton's work, demonstrating a strong connection to the ground truth.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en el contenido del libro.
- EN: pagina — Voz directa y enfoque en conceptos del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8323
- Tiempo total: 24.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1944ms
- anchors: 2136 tokens, 5067ms
- palette: 0 tokens, 0ms
- content_es: 2293 tokens, 5707ms
- judge_es: 682 tokens, 1549ms
- content_en: 1735 tokens, 5093ms
- judge_en: 668 tokens, 3295ms
- voice: 809 tokens, 812ms
- highlight_judge_es_parrafoTop: 648 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 651 tokens, 0ms
- highlight_judge_es_parrafoBot: 638 tokens, 0ms
- highlight_judge_en_parrafoTop: 633 tokens, 0ms
- highlight_judge_en_parrafoBot: 638 tokens, 0ms
