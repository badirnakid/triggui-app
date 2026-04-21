# Quality Report — Cómo aprender la excelencia

**Autor:** Eric Potterat & Alan Eagle
**Ejecutado:** 2026-04-21T13-31-01
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

¡Decídete a alcanzar tu máximo potencial! Cómo aprender la excelencia es una guía completa y práctica de disciplina mental para el alto rendimiento, creada por el experto que desarrolló el programa de resistencia mental de los Navy SEAL de los Estados Unidos y que ha trabajado con miles de atletas de élite, personal militar de alto rango, ejecutivos de empresas y socorristas para emergencias. Todos ellos tienen algo en común: saben cómo pensar con claridad, mantenerse enfocados y superar contratiempos bajo niveles muy altos de estrés. Pueden tener habilidades físicas e intelectuales sobresalientes, pero es lo que ocurre en su mente lo que los hace destacar: la diferencia entre ser bueno y ser excelente se basa por completo en su enfoque mental. Este enfoque...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- disciplinas mentales para el alto rendimiento
- superar contratiempos bajo estrés
- mentalidad de alto desempeño
- valores y metas
- equilibrio y recuperación

**Key terms:** resistencia mental, alto rendimiento, mentalidad, tolerancia a la adversidad, enfoque mental

**Voz autorial:** El autor utiliza un tono motivacional y práctico, con un enfoque en la aplicación de principios para mejorar el desempeño personal y profesional.

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
- Razón: The generated content closely reflects the specific concepts outlined in the ground truth, such as 'disciplinas mentales', 'equilibrio y recuperación', and 'valores y metas'. It emphasizes the importance of mental discipline for high performance, which is a central theme of the book. The phrases and ideas presented are directly tied to the book's teachings, making it highly specific and not easily

### EN
- Score: 0.90
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the concepts outlined in the ground truth, particularly the emphasis on mental disciplines, overcoming adversity, and the importance of balance and recovery. Phrases like 'mental disciplines' and 'overcoming obstacles' directly relate to the book's focus on mental strategies for high performance. However, while it is highly relevant, some phrases could be phr

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas.
- EN: pagina — Uso de voz directa y preguntas retóricas.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.95 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10873
- Tiempo total: 27.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 3912ms
- anchors: 2636 tokens, 4056ms
- palette: 0 tokens, 0ms
- content_es: 2824 tokens, 9446ms
- judge_es: 1199 tokens, 1845ms
- content_en: 2253 tokens, 5692ms
- judge_en: 1159 tokens, 1670ms
- voice: 802 tokens, 966ms
