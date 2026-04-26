# Quality Report — Educación financiera

**Autor:** Iñaki Jiménez Largo
**Ejecutado:** 2026-04-26T13-38-26
**Pipeline:** nucleus-canonical-v3.6

---

## 🌐 Grounding

- **Source:** `identity_sealed_with_evidence`
- **Tier reached:** 1.5
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_preloaded
- **Match score:** 1.00



### Ground truth utilizado
```
LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:
Título: Educación financiera
Autor: Iñaki Jiménez Largo

SINOPSIS OFICIAL (Apple Books):

¿Te gustaría dejar de preocuparte por tu dinero a final de mes? La solución a tu problema no pasa por quejarte por cómo te han ido las cosas hasta el momento. Debes empezar por adquirir unos conocimientos básicos sobre educación financiera. Aunque el mundo financiero te pueda parecer algo complejo, te prometo que la lectura de este libro te ayudará a comprender todos aquellos conceptos económicos que serán clave para que tus decisiones resulten más acertadas. No se trata de que trabajes muchas más horas para intentar tener unos pocos ingresos más a final de mes. El objetivo será que tu dinero siga trabajando para ti mientras tú disfrutas de una agradable v...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la importancia de la educación financiera básica
- diferencia entre invertir y gastar
- estrategias de ahorro e inversión
- momento adecuado para endeudarse
- impacto de la COVID-19 en las finanzas personales

**Key terms:** educación financiera, inversión, ahorro, endeudamiento, finanzas personales

**Voz autorial:** El autor utiliza un tono didáctico y accesible, dirigido a lectores que buscan entender conceptos financieros básicos de manera clara y práctica.

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
- Razón: The generated content directly reflects key concepts from the book 'Educación financiera', such as the importance of financial education, the distinction between saving and investing, and the idea of making money work for you. Phrases like 'ahorrar para invertir' and 'la educación financiera es la base de unas finanzas saludables' are specific to the book's themes, demonstrating a strong alignment

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The content reflects key concepts from the book, such as the importance of financial education, saving, and investing. Phrases like 'your money starts working for you' and 'preparing to invest wisely' align closely with the book's focus on financial literacy and personal finance strategies. However, some phrases are somewhat generic and could apply to various financial self-help materials.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas sin referencias externas.
- EN: pagina — Tono directo y enfoque en conceptos de la obra.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.91 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 10257
- Tiempo total: 28.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 2ms
- anchors: 2512 tokens, 7374ms
- palette: 0 tokens, 1ms
- content_es: 2698 tokens, 8613ms
- judge_es: 1083 tokens, 2684ms
- content_en: 2114 tokens, 6234ms
- judge_en: 1055 tokens, 2361ms
- voice: 795 tokens, 1117ms
