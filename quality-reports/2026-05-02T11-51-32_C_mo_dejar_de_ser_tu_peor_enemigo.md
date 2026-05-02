# Quality Report — Cómo dejar de ser tu peor enemigo

**Autor:** Alba Cardalda
**Ejecutado:** 2026-05-02T11-51-32
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

QUERERSE ES FÁCIL, SI SABES CÓMO. Por la autora del best seller Cómo mandar a la m****a de forma educada. MÁS DE 300.000 PERSONAS YA LO RECOMIENDAN. Hay una persona con la que dialogas, debates, discutes, te enfadas y te reconcilias varias veces al día. Y no, no es tu pareja, ni tu jefe, ni tu padre ni tu madre. Eres tú. Tú eres la persona con quien más hablas e, irremediablemente, a quien más escuchas. Pero no siempre te hablas bien, ni siquiera con el respeto que pedirías a los demás. Y esto repercute en la relación que tienes contigo mismo y afecta directamente tu autoestima y tu salud mental. Tanto que a menudo te boicoteas y te acabas convirtiendo, sin saberlo, en tu peor enemigo. La neuropsicóloga Alba Cardalda nos muestra en este libro cómo operan nu...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia del diálogo interno en la autoestima
- herramientas para mejorar la relación contigo mismo
- aprender a tratarse con cariño y respeto
- técnicas de asertividad y mindfulness
- cómo dejar de boicotearse a uno mismo

**Key terms:** diálogo interno, autoestima, mindfulness, asertividad, cuidado personal

**Voz autorial:** La voz de la autora es empática y accesible, ofreciendo un enfoque práctico y directo sobre la autoayuda y el bienestar mental.

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
- Razón: The generated content directly reflects the book's themes of internal dialogue and self-esteem, using specific phrases like 'diálogo interno' and 'autoestima' which are central to the book's premise. It emphasizes the importance of positive self-talk and its impact on mental health, aligning perfectly with the author's message.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely aligns with the book's focus on self-talk and its impact on self-esteem, reflecting key themes from the ground truth. Phrases like 'internal dialogue' and 'self-perception' are specific to the book's message. However, some phrases are somewhat generic and could apply to other self-help contexts.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas personales.
- EN: pagina — Voz directa y enfoque en el diálogo interno personal.

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
- Tokens totales: 10121
- Tiempo total: 22.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1687ms
- anchors: 2642 tokens, 5656ms
- palette: 0 tokens, 0ms
- content_es: 2625 tokens, 6183ms
- judge_es: 982 tokens, 1523ms
- content_en: 2076 tokens, 4102ms
- judge_en: 1001 tokens, 2639ms
- voice: 795 tokens, 691ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoBot: 640 tokens, 0ms
- highlight_judge_en_parrafoTop: 643 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 649 tokens, 0ms
- highlight_judge_en_parrafoBot: 638 tokens, 0ms
