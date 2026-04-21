# Quality Report — Millonario en un fin de semana

**Autor:** Noah Kagan & Tahl Raz
**Ejecutado:** 2026-04-21T13-45-58
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

Incluye estrategias, desafíos,guiones y correos a prueba de balas. Este es el mejor momento de la historia para emprender. Hay oportunidades en todas partes para crear nuevos negocios, productos y servicios que ayuden a resolver los problemas del mundo. De hecho, personas comunes y corrientes inician negocios rentables todos los días. Simplemente no lo presumen en Instagram. Si toda la información que necesitas para iniciar un negocio está disponible de manera gratuita, ¿por qué parece tan difícil? Es fácil poner excusas: no hay buenas ideas, miedo al rechazo, mal momento, capital insuficiente, no tener un socio comercial… Pero todas tienen solución. A pesar de lo que algunas personas te digan, emprender no tiene por qué ser complicado. Millonario en un fin...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- crear un negocio en 48 horas
- enfoque Customer First
- encontrar tu Número de Libertad
- generar ideas de negocio sin límites
- libertad financiera y emprendimiento sin complicaciones

**Key terms:** emprender, estrategias de negocio, libertad financiera, customer first, número de libertad

**Voz autorial:** La voz del autor es motivacional y práctica, con un enfoque directo y accesible que busca empoderar al lector para que tome acción inmediata en su emprendimiento.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: triadic
- typography: sans_humanista
- Resultado: paper=#CFD1D3, accent=#127AE2, ink=#171A1C, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects key concepts from the ground truth of 'Millonario en un fin de semana,' such as the emphasis on starting a business in 48 hours, the importance of the Customer First approach, and the idea that entrepreneurship doesn't have to be complicated. Phrases like 'Crea un negocio en 48 horas' and 'La libertad financiera comienza con una decisión valiente' are not仅相关

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The generated content directly reflects specific concepts from the ground truth of 'Millonario en un fin de semana,' such as the idea of starting a business in 48 hours and the Customer First approach. Phrases like 'ordinary people launch successful businesses' and 'creating a business in just 48 hours' are explicitly aligned with the book's themes, making it highly relevant and specific to this 책

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y motivacional, sin referencias externas al libro.
- EN: pagina — Voz directa y motivacional, sin referencias externas al libro.

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
- Tokens totales: 10045
- Tiempo total: 25.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 4965ms
- anchors: 2461 tokens, 5200ms
- palette: 0 tokens, 0ms
- content_es: 2652 tokens, 5329ms
- judge_es: 1020 tokens, 1921ms
- content_en: 2091 tokens, 4789ms
- judge_en: 971 tokens, 2021ms
- voice: 850 tokens, 1016ms
