# Quality Report — Creative Visualization

**Autor:** Shakti Gawain
**Ejecutado:** 2026-05-02T03-23-41
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.82
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.67



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

La visualisation créatrice est l'art d'utiliser la puissance de l'imagination - et les images mentales qu'elle nous suggère - pour introduire dans notre vie des comportements positifs aux effets bénéfiques indéniables. Ce guide clair et pratique propose des techniques simples pour : développer le pouvoir créatif qui existe en chacun de nous . se débarrasser des habitudes négatives, accroître sa vitalité, améliorer sa santé . prendre du recul pour résoudre ses blocages intérieurs . se sentir plus détendu, plus serein . s'épanouir, atteindre ses objectifs sur le plan professionnel . établir et entretenir des relations humaines harmonieuses. Vous découvrirez qu'en visualisant une image précise de ce que vous désirez voir se réaliser, elle deviendra une réalité...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- uso de imágenes mentales para cambios positivos
- técnicas para eliminar hábitos negativos
- mejora de la salud y vitalidad
- resolución de bloqueos internos
- alcance de objetivos profesionales

**Key terms:** visualización, afirmaciones, poder creativo, relaciones armoniosas, técnicas simples

**Voz autorial:** La voz de Gawain es clara, accesible y empoderadora, utilizando ejemplos vívidos que facilitan la comprensión y aplicación de sus conceptos.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content closely reflects the concepts from the ground truth, specifically mentioning visualization as a tool for positive change, aligning with the book's focus on using mental imagery to achieve goals and improve well-being. Phrases like 'deshacerse de hábitos negativos' and 'aumentar la vitalidad' directly relate to the techniques outlined in the book.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the ground truth by specifically referencing visualization techniques, the power of mental imagery, and the transformation of negative habits into positive outcomes, all of which are central themes in Shakti Gawain's work.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y enfoque en la práctica de visualización.
- EN: pagina — Uso de voz directa y enfoque en la práctica de visualización.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.82 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlight_es_parrafoBot_residual_warning
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9138
- Tiempo total: 38.1s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 17113ms
- anchors: 2385 tokens, 5902ms
- palette: 0 tokens, 0ms
- content_es: 2451 tokens, 5583ms
- judge_es: 829 tokens, 1648ms
- content_en: 1886 tokens, 4421ms
- judge_en: 802 tokens, 1909ms
- voice: 785 tokens, 897ms
- highlight_judge_es_parrafoTop: 644 tokens, 0ms
- highlight_judge_es_parrafoBot: 658 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 672 tokens, 0ms
- highlight_judge_en_parrafoTop: 648 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 654 tokens, 0ms
- highlight_judge_en_parrafoBot: 641 tokens, 0ms
