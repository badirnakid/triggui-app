# Quality Report — Confía en mí estoy mintiendo

**Autor:** Ryan Holiday
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

Libro verificado en OpenLibrary. Publicado originalmente en 2013.

METADATA VERIFICADA:
- Título: Confía en mí, estoy mintiendo
- Autor: Ryan Holiday
- Año: 2013
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la manipulación de los medios digitales
- el impacto de los blogs en la información
- la creación de rumores virales
- la distorsión de la realidad en línea
- el control de la narrativa mediática

**Key terms:** manipulación, blogs, rumores, narrativa, medios digitales

**Voz autorial:** La voz de Ryan Holiday es provocativa y directa, utilizando un tono audaz para desafiar las percepciones sobre los medios y la verdad en la era digital.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: sans_humanista
- Resultado: paper=#CFD1D3, accent=#127AE2, ink=#171A1C, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects key themes from 'Confía en mí, estoy mintiendo', particularly the manipulation of media and the distortion of truth. Phrases like 'manipulación de los medios digitales' and 'rumores virales' are closely aligned with the book's focus on media influence and misinformation. However, while it is specific to the book's themes, the language could still be interpreted in a broader, a

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects key themes from 'Confía en mí, estoy mintiendo', particularly the manipulation of media and perception of truth. Phrases about questioning narratives and the role of blogs align closely with the book's focus on media manipulation. However, it lacks direct references to specific examples or concepts unique to the book, which prevents a perfect score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.80)
- ES: pagina — Tono directo y reflexivo, sin referencias externas al libro.
- EN: pagina — Tono directo y reflexivo, sin referencias meta al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.9 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.8 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8535
- Tiempo total: 47.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 18253ms
- anchors: 2291 tokens, 10261ms
- palette: 0 tokens, 0ms
- content_es: 2310 tokens, 6675ms
- judge_es: 696 tokens, 2354ms
- content_en: 1753 tokens, 6321ms
- judge_en: 666 tokens, 2632ms
- voice: 819 tokens, 1116ms
- highlight_judge_es_parrafoTop: 638 tokens, 0ms
- highlight_judge_es_parrafoBot: 652 tokens, 0ms
- highlight_judge_en_parrafoTop: 650 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 652 tokens, 0ms
- highlight_judge_en_parrafoBot: 648 tokens, 0ms
