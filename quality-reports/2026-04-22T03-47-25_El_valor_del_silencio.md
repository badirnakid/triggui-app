# Quality Report — El valor del silencio

**Autor:** Justin Zorn
**Ejecutado:** 2026-04-22T03-47-25
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.93
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.96



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El silencio es un poder secreto que nos centra, nos sana y nos enseña. Dos especialistas en bienestar del más alto nivel nos desvelan los beneficios del silencio en un mundo más ruidoso que nunca. La proliferación del ruido no se refiere solamente al sentido auditivo y literal, sino también a las pantallas yal ruido de la información, que consume nuestra atención. Si bien el mindfulness nos puede ayudar a frenar los prejuicios del ruido constante, los estudios señalan que no todo el mundo es capaz de meditar con regularidad. Necesitamos nuevas maneras de encontrar claridad y renovación. Recurriendo a la ciencia, la psicología, la filosofía y la espiritualidad, Justin Zorn y Leigh Marz nos demuestran el poder del silencio inmersivo, un tipo de silencio más p...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el silencio como poder secreto que centra y sana
- impacto del ruido en la atención y bienestar
- silencio inmersivo como práctica renovadora
- propuestas prácticas para eliminar el ruido
- la intersección de ciencia, psicología, filosofía y espiritualidad en el silencio

**Key terms:** silencio inmersivo, ruido sensorial, mindfulness, claridad, renovación

**Voz autorial:** La voz de los autores es informativa y reflexiva, combinando ciencia y espiritualidad para ofrecer un enfoque práctico y accesible sobre el silencio en un mundo ruidoso.

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
- Razón: The generated content directly reflects the core themes and concepts presented in the ground truth of the book, such as the transformative power of silence, the impact of noise on attention and well-being, and the integration of science, psychology, and spirituality. Phrases like 'silencio inmersivo' and 'eliminar el ruido exterior' are specific to the book's focus, making the content highly tied.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the ground truth of the book, utilizing specific concepts such as 'immersive silence,' 'centers and heals,' and references to 'science, psychology, and spirituality.' The phrases reflect the book's focus on the benefits of silence in a noisy world, making it highly specific to the themes presented in 'El valor del silencio.'

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre el silencio sin referencias externas.
- EN: pagina — Tono reflexivo y directo, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.93 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.89 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.94**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9804
- Tiempo total: 62.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40375ms
- anchors: 2570 tokens, 6493ms
- palette: 0 tokens, 0ms
- content_es: 2575 tokens, 5669ms
- judge_es: 920 tokens, 2587ms
- content_en: 2018 tokens, 4385ms
- judge_en: 881 tokens, 1978ms
- voice: 840 tokens, 656ms
