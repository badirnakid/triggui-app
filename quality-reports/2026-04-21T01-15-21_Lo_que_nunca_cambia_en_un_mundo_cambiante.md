# Quality Report — Lo que nunca cambia en un mundo cambiante

**Autor:** Morgan Housel
**Ejecutado:** 2026-04-21T01-15-21
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **El hombre más rico de Babilonia** (George S. Clason): Ofrece lecciones sobre finanzas personales y sabiduría atemporal.
- **Padre rico, padre pobre** (Robert Kiyosaki): Explora conceptos de educación financiera y mentalidad sobre el dinero.
- **Los secretos de la mente millonaria** (T. Harv Eker): Aborda creencias y hábitos que afectan el éxito financiero.
- **La bolsa o la vida** (Joe Dominguez y Vicki Robin): Enfoca en la relación entre el dinero y la vida personal, con lecciones prácticas.
- **El inversor inteligente** (Benjamin Graham): Proporciona principios de inversión y filosofía financiera duradera.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente aborda lecciones sobre finanzas personales y cómo adaptarse a un mundo en constante cambio, ofreciendo consejos prácticos y reflexiones sobre la vida y el dinero.

VOZ INFERIDA:
Es probable que el autor tenga una voz accesible y reflexiva, orientada a la enseñanza y la motivación, buscando conectar con el lector de manera directa y personal.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "El hombre más rico de Babilonia" (George S. Clason): Ofrece lecciones sobre finanzas personales y sabiduría atemporal.
- "Padre rico, padre pobre" (Robert Kiyosaki): Explora conceptos de educación financiera y mentalidad sobre el dinero.
- "Los secretos de la mente millonaria" (T. Harv Eker): Abo...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- lecciones atemporales sobre finanzas personales
- adaptación a un mundo en constante cambio
- consejos prácticos para la vida y el dinero

**Key terms:** finanzas personales, adaptación, sabiduría atemporal, reflexiones, conexión personal

**Voz autorial:** La voz del autor es accesible y reflexiva, orientada a la enseñanza y la motivación, buscando conectar con el lector de manera directa y personal.

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
- Score: 0.90
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: El contenido generado refleja de manera muy específica el tema del libro sobre finanzas personales y adaptación a cambios, utilizando frases como 'lecciones atemporales sobre finanzas personales' y 'la adaptación es la brújula que guía a los sabios'. Estas ideas están alineadas con el enfoque reflexivo y práctico del libro, aunque algunas frases podrían ser consideradas un poco más generales. Sin 

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects the inferred themes of personal finance and adaptation to change, using phrases like 'timeless lessons on personal finance' and 'financial future,' which align closely with the ground truth. However, while it is specific to the themes of the book, some phrases are somewhat generic and could apply to various self-help contexts, slightly lowering the score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre adaptación en finanzas personales.
- EN: pagina — Voz directa y reflexiones sobre adaptación en finanzas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.84 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.79**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9960
- Tiempo total: 44.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 590 tokens, 19731ms
- anchors: 2324 tokens, 5789ms
- palette: 0 tokens, 0ms
- content_es: 2520 tokens, 7542ms
- judge_es: 893 tokens, 2214ms
- content_en: 1955 tokens, 6353ms
- judge_en: 850 tokens, 2037ms
- voice: 828 tokens, 1038ms
