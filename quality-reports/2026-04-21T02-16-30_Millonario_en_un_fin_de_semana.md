# Quality Report — Millonario en un fin de semana

**Autor:** Noah Kagan & Tahl Raz
**Ejecutado:** 2026-04-21T02-16-30
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
- enfoque Customer First para generar ideas de negocio
- encontrar tu Número de Libertad
- superar excusas comunes para emprender
- gestionar un negocio mientras vives la vida de tus sueños

**Key terms:** emprendimiento, libertad financiera, estrategias de negocio, retos emprendedores, creación de productos

**Voz autorial:** La voz autorial es directa, motivacional y práctica, enfocándose en la simplificación del proceso de emprendimiento y en la superación de obstáculos comunes.

---

## 🎨 Visual synthesis

- hue_primary: 45
- saturation: vivid
- lightness_paper: medium_light
- temperature_shift: 10
- palette_strategy: complementary
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#E2D112, ink=#1C1B17, contraste=11.48:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects specific concepts from the ground truth, such as 'crear un negocio en 48 horas' and 'superar las excusas comunes', which are central themes in 'Millonario en un fin de semana'. The phrases used are not generic and align closely with the book's focus on entrepreneurship and actionable strategies.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes and concepts presented in the official synopsis of 'Millonario en un fin de semana.' It emphasizes launching a business quickly and overcoming excuses, which are key ideas in the book. Phrases like 'launch a business within 48 hours' and 'overcoming common excuses' directly reflect the book's focus on practical entrepreneurship strategies. While

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en el proceso de emprendimiento.
- EN: pagina — Voz directa y enfoque en la acción, sin referencias externas.

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
- Tokens totales: 9749
- Tiempo total: 64.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 41416ms
- anchors: 2462 tokens, 5380ms
- palette: 0 tokens, 0ms
- content_es: 2610 tokens, 7222ms
- judge_es: 953 tokens, 2496ms
- content_en: 2020 tokens, 5118ms
- judge_en: 941 tokens, 2118ms
- voice: 763 tokens, 856ms
