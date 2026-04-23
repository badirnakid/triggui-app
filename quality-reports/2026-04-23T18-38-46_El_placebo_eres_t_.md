# Quality Report — El placebo eres tú

**Autor:** Joe Dispenza
**Ejecutado:** 2026-04-23T18-38-46
**Pipeline:** nucleus-canonical-v3

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

El cuerpo cree lo que dice la mente. Descubre el poder de la mente para sanar el cuerpo de la mano del doctor Joe Dispenza, el autor best seller que ha transformado la vida de millones de lectores. ¿Es posible sanar solo con el poder del pensamiento, sin medicamentos ni cirugía? Lo cierto es que ocurre mucho más a menudo de lo que imaginas. En El placebo eres tú, Joe Dispenza comparte numerosos casos documentados de personas que han revertido las enfermedades cardiacas, la depresión, la artritis incapacitante e incluso los temblores del párkinson gracias a su creencia en un placebo. Del mismo modo, el doctor Dispenza relata cómo otras personas han enfermado, e incluso muerto, al haberles diagnosticado erróneamente una enfermedad mortal. Sucede así, afirma, ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el poder del pensamiento para sanar el cuerpo
- la mente como herramienta de transformación personal
- efecto placebo como capacidad innata de creación

**Key terms:** neurociencia, biología, psicología, efecto placebo, transformación personal

**Voz autorial:** La voz de Joe Dispenza es científica y motivadora, combinando evidencia empírica con un enfoque accesible que invita a la reflexión y a la acción en la vida del lector.

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
- Razón: The generated content directly reflects key concepts from the book 'El placebo eres tú' by Joe Dispenza, such as the power of the mind to heal the body, the effect of beliefs on health, and the transformative potential of the placebo effect. Phrases like 'la mente posee un poder asombroso para sanar el cuerpo' and 'la creencia en el efecto placebo' are explicitly tied to the book's themes and its,

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The generated content reflects key concepts from the ground truth, such as the power of the mind to heal the body and the idea of reprogramming thoughts to access health and transformation. Phrases like 'belief in the placebo effect' and 'healing begins where belief and intention converge' are closely related to the themes presented in Joe Dispenza's book. However, the language is somewhat generic

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias meta.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.85 ← promedio de los 2 judges
- **Combined:** **0.91**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10831
- Tiempo total: 20.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1462ms
- anchors: 2700 tokens, 4133ms
- palette: 0 tokens, 0ms
- content_es: 2785 tokens, 5221ms
- judge_es: 1175 tokens, 2648ms
- content_en: 2221 tokens, 4879ms
- judge_en: 1130 tokens, 1650ms
- voice: 820 tokens, 762ms
