# Quality Report — Saber de libros sin leer

**Autor:** Henry Hitchings
**Ejecutado:** 2026-05-01T15-22-09
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `identity_sealed_with_evidence`
- **Tier reached:** 1.5
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:
Título: Saber de libros sin leer
Autor: Henry Hitchings

SINOPSIS OFICIAL (Apple Books):

¿Alguna vez te has preguntado por qué hay gente que parece tener una opinión sobre todos los libros que se han publicado? En la actualidad existe un gran volumen de libros, así que ¿cómo se puede ser culto con este panorama? Si has dejado para más adelante leer a Jane Austen, o quieres defenderte en un debate sobre El tiempo perdido de Proust, no busques más. Con consejos sobre cómo fingir saber de todo con seguridad, utilizando citas y curiosidades que no tienen precio, Henry Hitchings aborda con ingenio los libros más destacados que se supone todo el mundo debería haber leído. Esta guía te proporcionará toda la información literaria que necesitas para sa...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- cómo fingir saber de libros que no has leído
- citas y curiosidades literarias
- defensa en debates sobre clásicos literarios
- información literaria esencial para conversaciones
- estrategias para parecer culto en temas literarios

**Key terms:** cultura literaria, debate literario, citas célebres, conversación culta, conocimiento superficial

**Voz autorial:** La voz de Hitchings es ingeniosa y accesible, combinando humor con un enfoque práctico para abordar la cultura literaria.

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
- Razón: El contenido generado refleja de manera precisa los conceptos del libro, como la idea de usar citas y curiosidades literarias para aparentar conocimiento. Frases como 'fingir que sabes de libros sin haberlos leído' y 'conocer información literaria esencial' están directamente alineadas con la sinopsis del libro, que trata sobre cómo navegar conversaciones literarias sin haber leído los textos. Por

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects the book's theme of discussing literature without reading it, emphasizing preparation and wit, which aligns with Hitchings' approach. It uses concepts like 'clever quotes' and 'literary trivia,' directly related to the book's premise. However, it lacks specific references to the authors or works mentioned in the book, which prevents a perfect score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Tono directo y preguntas retóricas sugieren voz del autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlight_en_parrafoTop_residual_warning
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9334
- Tiempo total: 22.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2341 tokens, 6373ms
- palette: 0 tokens, 1ms
- content_es: 2496 tokens, 6106ms
- judge_es: 878 tokens, 2473ms
- content_en: 1941 tokens, 4184ms
- judge_en: 865 tokens, 1662ms
- voice: 813 tokens, 1343ms
- highlight_judge_es_parrafoTop: 648 tokens, 0ms
- highlight_judge_es_parrafoBot: 649 tokens, 0ms
- highlight_judge_en_parrafoTop: 642 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 641 tokens, 0ms
- highlight_judge_en_parrafoBot: 637 tokens, 0ms
