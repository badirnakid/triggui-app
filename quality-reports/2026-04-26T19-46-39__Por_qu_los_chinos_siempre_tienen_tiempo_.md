# Quality Report — ¿Por qué los chinos siempre tienen tiempo?

**Autor:** Christine Cayol
**Ejecutado:** 2026-04-26T19-46-39
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_4sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

• Una obra que nos muestra cómo desarrollarnos personal y profesionalmente desde una nueva relación con el tiempo. • Una nueva visión del tiempo basada en una cultura tan sabia y milenaria como la china. • Christine Cayol es filósofa de formación y consultora de relaciones internacionales afincada en Pekín. «No llegaremos nunca», «el día solo tiene veinticuatro horas», «esto es para anteayer». La falta de tiempo es una enfermedad social que nos impide estar presentes en nuestras interacciones diarias. No vemos, no oímos y no somos capaces de crear nada porque estamos desbordados. Christine Cayol se inspira en la cultura china para mostrarnos una nueva forma de gestionar el tiempo, la vida y el futuro más eficaz, más libre y creativa, más espiritual (y diame...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- nueva relación con el tiempo
- gestión del tiempo basada en la cultura china
- conciliación de acción y disponibilidad
- corte con la urgencia y la multitarea
- transformación del 'no tengo tiempo' en '¿por qué no?'

**Key terms:** sabiduría milenaria, filosofía china, interacciones diarias, adición a la información, multitarea

**Voz autorial:** La voz de Christine Cayol es reflexiva y filosófica, combinando una perspectiva intercultural con experiencias personales, lo que permite una conexión profunda con el lector.

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
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the core themes of Christine Cayol's book, such as the relationship with time, the influence of Chinese philosophy, and the importance of managing urgency and multitasking. Phrases like 'transformar el 'no tengo tiempo' en '¿por qué no?'' and 'conciliar acción y disponibilidad' are specific to the book's concepts, demonstrating a clear connection to its core

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of the book, particularly the emphasis on rethinking our relationship with time and the influence of Chinese philosophy. Phrases like 'reconciliation of action and availability' and 'cutting through urgency' reflect specific concepts from the ground truth. However, some phrases are slightly more generic and could apply to broader self-help or ph



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la relación con el tiempo.
- EN: pagina — Voz directa y reflexiones sobre la percepción del tiempo.

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
- highlights_auto_corrected_v3.7: 1 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10633
- Tiempo total: 33.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2026ms
- anchors: 2757 tokens, 11895ms
- palette: 0 tokens, 0ms
- content_es: 2737 tokens, 6601ms
- judge_es: 1102 tokens, 3654ms
- content_en: 2158 tokens, 5580ms
- judge_en: 1064 tokens, 2051ms
- voice: 815 tokens, 1281ms
- highlight_judge_es_parrafoTop: 649 tokens, 0ms
- highlight_judge_es_parrafoTop_retry: 648 tokens, 0ms
- highlight_judge_es_parrafoBot: 639 tokens, 0ms
- highlight_judge_en_parrafoTop: 642 tokens, 0ms
- highlight_judge_en_parrafoBot: 637 tokens, 0ms
