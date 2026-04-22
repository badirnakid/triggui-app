# Quality Report — Indistractable

**Autor:** Nir Eyal
**Ejecutado:** 2026-04-22T22-13-17
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `model_inference`
- **Tier reached:** 3
- **Book identity confidence:** 0.60
- **Resolution path:** evidence_fetched_0sources → tier3_conf_0.80


### Libros similares considerados (inferencia)
- **Deep Work** (Cal Newport): Explora la importancia de la concentración en un mundo lleno de distracciones.
- **The Power of Habit** (Charles Duhigg): Analiza cómo los hábitos afectan nuestra vida y cómo podemos cambiarlos.
- **Atomic Habits** (James Clear): Ofrece estrategias para formar buenos hábitos y romper los malos, relacionado con el control de la atención.
- **Digital Minimalism** (Cal Newport): Aborda cómo reducir el uso de tecnología para mejorar la calidad de vida y la atención.


### Ground truth utilizado
```
TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):

El libro probablemente trata sobre la gestión de la atención y la autodisciplina en un mundo lleno de distracciones, ofreciendo estrategias para mejorar la productividad personal.

VOZ INFERIDA:
Es probable que la voz del autor sea práctica y motivacional, enfocándose en la autoayuda y el desarrollo personal.

LIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:
- "Deep Work" (Cal Newport): Explora la importancia de la concentración en un mundo lleno de distracciones.
- "The Power of Habit" (Charles Duhigg): Analiza cómo los hábitos afectan nuestra vida y cómo podemos cambiarlos.
- "Atomic Habits" (James Clear): Ofrece estrategias para formar buenos hábitos y romper los malos, relacionado con el control de la at...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategias para controlar la atención
- autodisciplina en un mundo lleno de distracciones
- mejora de la productividad personal

**Key terms:** gestión de la atención, autodisciplina, distracciones, productividad, enfoque

**Voz autorial:** La voz del autor es práctica y motivacional, centrada en la autoayuda y el desarrollo personal.

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
- Razón: The generated content directly addresses themes of attention management and self-discipline, which align closely with the inferred themes of the book. Phrases like 'crear un entorno que favorezca la concentración' and 'transformar tu enfoque en una herramienta poderosa' reflect specific concepts related to productivity and focus, making it highly relevant to the book's ground truth.

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The content is highly relevant to the inferred themes of attention management and self-discipline, using specific concepts like 'self-discipline', 'environment conducive to focus', and 'habits that strengthen your self-discipline'. It reflects a practical and motivational voice, aligning closely with the inferred voice of the author. The phrases and ideas presented are tailored to the book's focus

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la autodisciplina sin referencias externas.
- EN: pagina — Tono directo y enfoque en la autoayuda sin referencias externas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.6 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.84**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 8
- Tokens totales: 9386
- Tiempo total: 61.7s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 518 tokens, 35879ms
- anchors: 2224 tokens, 5077ms
- palette: 0 tokens, 1ms
- content_es: 2419 tokens, 6477ms
- judge_es: 816 tokens, 2975ms
- content_en: 1839 tokens, 4731ms
- judge_en: 777 tokens, 4222ms
- voice: 793 tokens, 2375ms
