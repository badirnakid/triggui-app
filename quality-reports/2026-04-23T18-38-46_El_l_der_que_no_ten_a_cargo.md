# Quality Report — El líder que no tenía cargo

**Autor:** Robin Sharma
**Ejecutado:** 2026-04-23T18-38-46
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

Robin Sharma, autor del internacional best seller El monje que vendió su Ferrari, regresa a la parábola con una historia inspiracional acerca del nuevo significado y valor del liderazgo. Robin Sharma ha compartido durante más de quince años su fórmula para el éxito con las empresas líderes de Fortune 500 y personajes destacados en todo el mundo, una receta que le ha convertido en uno de los asesores de liderazgo más solicitados internacionalmente. Ahora, por primera vez, Sharma comparte sus conocimientos excepcionales con todos sus lectores. Siguiendo sus consejos podrás realizarte como el mejor en tu campo a la vez que contribuirás con tu talento a que tu empresa alcance las metas más altas, algo que resulta esencial en los tiempos turbulentos que estamos ...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- influir en los demás independientemente de la posición laboral
- reconocer oportunidades en tiempos de cambio
- secretos de la innovación profunda
- estrategias para crear equipos efectivos
- tácticas para desarrollar poder mental y físico

**Key terms:** liderazgo sin cargo, mentalidad invencible, estrategia de equipo, innovación profunda, equilibrio personal

**Voz autorial:** La voz de Robin Sharma es inspiradora y motivacional, utilizando parábolas y consejos prácticos para empoderar al lector.

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
- Razón: The generated content directly reflects key concepts from the ground truth of 'El líder que no tenía cargo', such as the idea that leadership is not defined by one's position but by the ability to influence others. Phrases like 'mentalidad invencible' and 'oportunidades en tiempos de cambio' are explicitly mentioned in the book's synopsis, demonstrating a strong connection to the source material.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of Robin Sharma's book, particularly the concepts of leadership without a title and the importance of mindset in influencing others. Phrases like 'influence is your true power' and 'embracing an invincible mindset' reflect specific ideas from the ground truth. However, some phrases are somewhat generic and could apply to other self-help or self-

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y preguntas retóricas.
- EN: pagina — Uso de voz directa y tono coherente con la obra.

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
- Tokens totales: 10769
- Tiempo total: 59.4s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 40436ms
- anchors: 2596 tokens, 4683ms
- palette: 0 tokens, 0ms
- content_es: 2795 tokens, 4986ms
- judge_es: 1165 tokens, 2095ms
- content_en: 2245 tokens, 4235ms
- judge_en: 1126 tokens, 1677ms
- voice: 842 tokens, 1264ms
