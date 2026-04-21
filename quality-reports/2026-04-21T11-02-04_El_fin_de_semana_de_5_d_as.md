# Quality Report — El fin de semana de 5 días

**Autor:** Nik Halik, Garret B. Gunderson
**Ejecutado:** 2026-04-21T11-02-04
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `google_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Google Books):

¡Tú sabes que hay una mejor manera de vivir y quieres más de la vida! ¡Tienes esperanzas y sueños! Anhelas salirte de esa rueda de la rutina que te exprime financieramente mes a mes y dejar de vivir por las reglas que te imponen la sociedad y otras personas. Sin embargo, nunca has tenido claro cuál es la manera más eficaz de alcanzar tus metas... hasta ahora. El fin de semana de 5 días es: *Un conjunto de estrategias que te ayudarán a dejar de lado esa rutina de trabajo de 8:00 am a 6:00 pm para que comiences a ir tras tus metas más soñadas y las logres. *Más que inspiración, un plan que te mostrará cómo construir múltiples fuentes de ingreso. *Más que un concepto, una visión real del mundo. Sus historias acerca de emprendedores de la vida diaria te servir...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategias para dejar la rutina de trabajo tradicional
- construcción de múltiples fuentes de ingreso
- historias de emprendedores de la vida diaria
- visión real del mundo y propósito de vida
- opciones para sentirse realizado

**Key terms:** libertad financiera, propósito de vida, rutina de trabajo, múltiples fuentes de ingreso, visión del mundo

**Voz autorial:** La voz autorial es motivacional y práctica, enfocándose en guiar al lector hacia un cambio tangible en su estilo de vida y en la forma de alcanzar sus metas.

---

## 🎨 Visual synthesis

- hue_primary: 60
- saturation: vivid
- lightness_paper: light
- temperature_shift: 10
- palette_strategy: triadic
- typography: sans_humanista
- Resultado: paper=#F0F0EF, accent=#C0E212, ink=#1B1C17, contraste=15.03:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the key concepts from the ground truth, such as breaking away from traditional work routines, building multiple sources of income, and pursuing a life with purpose. Phrases like 'libertad financiera' and 'propósito de vida' are explicitly aligned with the themes presented in the book's synopsis, making it highly specific to 'El fin de semana de 5 días'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content closely reflects the themes and concepts from the ground truth, such as financial freedom, leaving the traditional work routine, and building multiple streams of income. Phrases like 'embrace a fuller life' and 'stories of everyday entrepreneurs' directly connect to the book's focus on practical strategies and real-life examples. However, some phrases are slightly generic and could be,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias meta.
- EN: pagina — Tono directo y motivacional, sin referencias externas al autor.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.88 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9857
- Tiempo total: 30.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 1991ms
- anchors: 2441 tokens, 6624ms
- palette: 0 tokens, 1ms
- content_es: 2615 tokens, 5372ms
- judge_es: 966 tokens, 1671ms
- content_en: 2059 tokens, 11594ms
- judge_en: 929 tokens, 1989ms
- voice: 847 tokens, 1201ms
