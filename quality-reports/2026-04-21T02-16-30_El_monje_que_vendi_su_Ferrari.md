# Quality Report — El monje que vendió su Ferrari

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-21T02-16-30
**Pipeline:** nucleus-canonical-v3

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

El monje que vendió su Ferrari es una fábula espiritual que, desde hace más de quince años, ha marcado la vida de millones de personas en todo el mundo. A través de sus páginas, conocemos la extraordinaria historia de Julian Mantle, un abogado de éxito que, tras sufrir un ataque al corazón, debe afrontar el gran vacío de su existencia. Inmerso en esta crisis existencial, Julian toma la radical decisión de vender todas sus pertenencias y viajar a la India. Es en un monasterio del Himalaya donde aprende las sabias y profundas lecciones de los monjes sobre la felicidad, el coraje, el equilibrio y la paz interior. Con esta historia tan especial e inolvidable, Robin Sharma nos enseña, paso a paso, una nueva manera de enfocar la vida personal, profesional y famil...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la búsqueda del equilibrio y la paz interior
- la transformación personal a través de la crisis
- la importancia de tener una dirección clara en la vida
- las lecciones de los monjes sobre la felicidad y el coraje
- el viaje como un medio de autodescubrimiento

**Key terms:** fábula espiritual, crisis existencial, armonía interior, sabiduría de los monjes, recorrido vital

**Voz autorial:** La voz de Robin Sharma es inspiradora y didáctica, utilizando un tono accesible que invita a la reflexión y al cambio personal.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: serif_moderno
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content reflects specific themes from 'El monje que vendió su Ferrari,' such as the pursuit of peace, personal transformation through crisis, and the importance of introspection. Phrases like 'la verdadera felicidad no reside en las posesiones' and references to 'un monasterio en el Himalaya' directly connect to Julian Mantle's journey and the lessons he learns. However, some phrases

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects key themes from the book, such as personal transformation through crisis and the pursuit of inner peace, which are central to Julian Mantle's journey. Phrases like 'true happiness lies not in possessions' and 'embrace the crisis' resonate with the book's message. However, the language is somewhat generic and could apply to various self-help contexts, which prevents a perfect 1

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el viaje interior.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.84 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9604
- Tiempo total: 64.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41334ms
- anchors: 2427 tokens, 5582ms
- palette: 0 tokens, 0ms
- content_es: 2586 tokens, 6437ms
- judge_es: 929 tokens, 1866ms
- content_en: 1985 tokens, 6407ms
- judge_en: 874 tokens, 2252ms
- voice: 803 tokens, 1051ms
