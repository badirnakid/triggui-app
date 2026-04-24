# Quality Report — Trillion Dollar Coach

**Autor:** Eric Schmidt, Jonathan Rosenberg & Alan Eagle
**Ejecutado:** 2026-04-24T03-08-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

#1 Wall Street Journal Bestseller New York Times Bestseller USA Today Bestseller The team behind How Google Works returns with management lessons from legendary coach and business executive, Bill Campbell, whose mentoring of some of our most successful modern entrepreneurs has helped create well over a trillion dollars in market value. Bill Campbell played an instrumental role in the growth of several prominent companies, such as Google, Apple, and Intuit, fostering deep relationships with Silicon Valley visionaries, including Steve Jobs, Larry Page, and Eric Schmidt. In addition, this business genius mentored dozens of other important leaders on both coasts, from entrepreneurs to venture capitalists to educators to football players, leaving behind a legacy...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- la creación de un 'sobre de confianza' para fomentar la seguridad psicológica en equipos de alto rendimiento
- la importancia de la cultura de equipo y cómo identificar a los 'hacedores' que priorizan el éxito de la empresa
- principios de gestión accionables para tomar decisiones difíciles y manejar talentos excepcionales
- la integración del amor y el respeto en el lugar de trabajo como clave para la excelencia operativa
- la construcción de relaciones profundas y significativas en entornos de trabajo dinámicos

**Key terms:** sobre de confianza, cultura de equipo, hacedores, principios de gestión, amor en el trabajo

**Voz autorial:** La voz autoral es inspiradora y práctica, enfocándose en la experiencia directa y las lecciones aprendidas de un mentor icónico en el mundo empresarial.

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
- Razón: The generated content explicitly references the concept of 'envelope of trust' and the importance of psychological safety, both of which are central themes in 'Trillion Dollar Coach.' Additionally, it discusses the significance of team culture and relationships, which are key principles outlined in the book. The phrases used are specific to the teachings of Bill Campbell as described in the ground

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content specifically references the concept of an 'envelope of trust,' which is a key principle from 'Trillion Dollar Coach.' It also discusses the importance of psychological safety and team dynamics, aligning closely with the book's themes of trust and team culture. The phrases used are directly related to the book's teachings, making it clear that the content is anchored to the 'T

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas reflexivas sobre el equipo.
- EN: pagina — Voz directa y enfoque en conceptos del libro.

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
- Tokens totales: 10953
- Tiempo total: 62.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42188ms
- anchors: 2819 tokens, 5688ms
- palette: 0 tokens, 0ms
- content_es: 2839 tokens, 5602ms
- judge_es: 1126 tokens, 2036ms
- content_en: 2258 tokens, 4590ms
- judge_en: 1087 tokens, 1895ms
- voice: 824 tokens, 782ms
