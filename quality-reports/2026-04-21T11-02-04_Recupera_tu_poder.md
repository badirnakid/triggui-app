# Quality Report — Recupera tu poder

**Autor:** Rut Nieves
**Ejecutado:** 2026-04-21T11-02-04
**Pipeline:** nucleus-canonical-v3

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

Libro verificado en OpenLibrary. Publicado originalmente en 2022.

METADATA VERIFICADA:
- Título: Recupera tu poder
- Autor: Rut Nieves
- Año: 2022
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- conexión con la fuerza vital
- desarrollo de la confianza interior
- acceso a la sabiduría interior
- superación de creencias limitantes
- vivir una vida auténtica y plena

**Key terms:** sabiduría interior, inteligencia emocional, autoestima, empoderamiento, claridad mental

**Voz autorial:** La voz de Rut Nieves es motivadora y empoderadora, invitando al lector a redescubrir su potencial y a tomar acción hacia una vida más plena.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: vivid
- lightness_paper: light
- temperature_shift: 10
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#F0F0EF, accent=#AEE212, ink=#1B1C17, contraste=15.03:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely aligns with the themes of empowerment and self-discovery, which are likely central to 'Recupera tu poder' by Rut Nieves. Phrases like 'conexión con la fuerza vital' and 'superar creencias limitantes' reflect specific concepts that suggest a deep engagement with the book's content. However, the language is somewhat generic and could be applicable to other self-help or哲

### EN
- Score: 0.30
- Usa conceptos específicos: false
- Razón: The generated content discusses concepts like 'vital force' and 'empowerment,' which are relevant to self-help themes but do not specifically reference unique ideas or terminology from 'Recupera tu poder' by Rut Nieves. The phrases are generic and could apply to many self-help books, lacking specific anchoring to the book's content.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y tono coherente con el contenido del libro.
- EN: pagina — Voz directa y tono coherente con el contenido del libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.55 ← promedio de los 2 judges
- **Combined:** **0.82**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 9
- Tokens totales: 11285
- Tiempo total: 28.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1911ms
- anchors: 2205 tokens, 4128ms
- palette: 0 tokens, 0ms
- content_es: 2304 tokens, 5038ms
- judge_es: 658 tokens, 3014ms
- content_es_retry: 2302 tokens, 5588ms
- judge_es_retry: 675 tokens, 0ms
- content_en: 1726 tokens, 4209ms
- judge_en: 612 tokens, 1946ms
- voice: 803 tokens, 614ms
