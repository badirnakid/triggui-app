# Quality Report — ¿Quién eres tú y qué haces aquí?

**Autor:** Jesús Yanes
**Ejecutado:** 2026-04-21T01-15-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `openlibrary`
- **Tier reached:** 2
- **Book identity confidence:** 0.88
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 0.82



### Ground truth utilizado
```
INFORMACIÓN (OpenLibrary):

Libro verificado en OpenLibrary. Publicado originalmente en 2020.

METADATA VERIFICADA:
- Título: ¿Quién eres tú y qué haces aquí? El Libro de iO
- Autor: Jesús Yanes
- Año: 2020
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- acceso directo al conocimiento profundo sobre la vida
- catalizador de transformación personal
- diferenciación entre relato ficticio y hechos reales
- creación de nuestra propia realidad
- autoconocimiento y propósito personal

**Key terms:** catalizador, transformación, realidad, autoconocimiento, existencia

**Voz autorial:** La voz de Jesús Yanes es reflexiva y provocativa, invitando al lector a cuestionar su propia existencia y propósito a través de una narrativa que mezcla ficción y realidad.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD2D3, accent=#1F99D6, ink=#171A1C, contraste=11.50:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.30
- Usa conceptos específicos: false
- Podría aplicar a cualquier libro: true
- Razón: The generated content discusses themes of self-discovery and transformation, which are common in many self-help and philosophical texts. While it touches on concepts like 'autoconocimiento' (self-knowledge) and 'transformación' (transformation), it does not specifically reference unique ideas or terms from '¿Quién eres tú y qué haces aquí? El Libro de iO' by Jesús Yanes. The phrases could easily, 

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses themes of knowledge, reality, and personal transformation, which are common in many self-help and philosophical texts. However, it does not reference any specific concepts, terms, or ideas from '¿Quién eres tú y qué haces aquí? El Libro de iO' by Jesús Yanes, making it too generic to be considered truly anchored to the book.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Tono reflexivo y directo, sin referencias externas al libro.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.88 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.3 ← promedio de los 2 judges
- **Combined:** **0.72**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 10
- Tokens totales: 13645
- Tiempo total: 54.1s
- Modelos usados: gpt-4o-mini-2024-07-18, gpt-4o

### Por fase
- grounding: 0 tokens, 17094ms
- anchors: 2239 tokens, 8389ms
- palette: 0 tokens, 1ms
- content_es: 2297 tokens, 6475ms
- judge_es: 647 tokens, 2826ms
- content_es_retry: 2296 tokens, 5035ms
- judge_es_retry: 658 tokens, 0ms
- content_es_escalate: 2313 tokens, 0ms
- content_en: 1748 tokens, 4558ms
- judge_en: 631 tokens, 2279ms
- voice: 816 tokens, 1419ms
