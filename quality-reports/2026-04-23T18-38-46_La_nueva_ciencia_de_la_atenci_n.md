# Quality Report — La nueva ciencia de la atención

**Autor:** Amishi Jha
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

Desde la constante reclamación de atención de la tecnología, hasta las 24 horas de titulares constantes y las abrumadoras exigencias del trabajo, a nuestra capacidad de concentración se le exige más que nunca. Estamos sufriendo un trastorno colectivo de déficit de atención que nos hace sentir dispersos, abrumados y ansiosos, pero incapaces de resistirse a distracciones como los correos electrónicos, las videollamadas, los mensajes o las notificaciones. En realidad, utilizamos toda nuestra atención en cada momento del día, pero la Dra. Jha ha descubierto que, a menos que creemos espacio en nuestra mente mediante una práctica diaria específica y dirigida, no podremos controlar lo que capta nuestra atención. Esto nos hace vulnerables a cualquier distracción, u...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- degradación de la atención
- práctica diaria de atención plena
- entrenamiento cognitivo en atención
- controlar distracciones tecnológicas
- mejorar el rendimiento personal

**Key terms:** atención plena, cognición, déficit de atención, práctica dirigida, espacio mental

**Voz autorial:** La voz de la autora es clara y accesible, combinando rigor científico con ejemplos prácticos y relatos de vida que ilustran la aplicación de sus técnicas.

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
- Razón: The generated content closely reflects the ground truth of the book by specifically mentioning concepts such as 'degradación de la atención', 'atención plena', and the practice of dedicating 'doce minutos al día' to improve cognitive performance. These phrases are directly tied to the themes and techniques outlined by Amishi Jha in her book, making the content highly relevant and specific.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the ground truth of the book by specifically addressing concepts such as 'attention degradation', 'daily mindfulness practice', and the importance of creating mental space. The phrases used are directly aligned with the themes presented in the book, making it clear that the content is not generic but rather specifically tailored to the ideas and techniques of

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y consejos prácticos sin referencias meta.
- EN: pagina — El texto ofrece consejos directos y prácticos sobre atención.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 1 ← promedio de los 2 judges
- **Combined:** **0.96**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9761
- Tiempo total: 20.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 850ms
- anchors: 2485 tokens, 4870ms
- palette: 0 tokens, 0ms
- content_es: 2578 tokens, 4300ms
- judge_es: 956 tokens, 2538ms
- content_en: 2014 tokens, 5417ms
- judge_en: 915 tokens, 1774ms
- voice: 813 tokens, 1017ms
