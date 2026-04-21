# Quality Report — Las casualidades no existen

**Autor:** Borja Vilaseca
**Ejecutado:** 2026-04-21T11-43-12
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El libro que hará que los creyentes cuestionen la religión y los ateos se abran a la espiritualidad. Estamos viviendo un hecho histórico imparable: cada vez la gente cree menos en las instituciones religiosas y -sin embargo- está cada vez más en contacto con su dimensión espiritual. Y esto se debe a que se está democratizando la sabiduría, provocando que los buscadores occidentales se adentren en la filosofía oriental. Como consecuencia de este viaje de autoconocimiento se está produciendo un despertar masivo de consciencia. Es decir, un profundo cambio en nuestra manera de concebirnos a nosotros mismos y de relacionarnos con la vida. Todas las personas que han despertado -creyentes, ateas o agnósticas- comparten una misma vivencia: que no sucede lo que que...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- el despertar masivo de consciencia
- la liberación de la 'pecera mental'
- la conexión con la vida y la alegría innata
- la espiritualidad como evolución personal
- el cuestionamiento de la religión y apertura a la espiritualidad

**Key terms:** espiritualidad, consciencia, autoconocimiento, filosofía oriental, pecera mental

**Voz autorial:** La voz de Borja Vilaseca es provocativa y accesible, invitando a los lectores a cuestionar sus creencias y a explorar su espiritualidad de manera práctica.

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
- Razón: The generated content directly references key concepts from the ground truth, such as 'pecera mental', 'despertar de consciencia', and the idea of spirituality as a path to personal evolution. It captures the essence of the book's themes about questioning beliefs and embracing spiritual growth, making it highly specific to 'Las casualidades no existen'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely reflects the themes of awakening, self-discovery, and the connection to life as described in the ground truth. Phrases like 'free ourselves from the mental aquarium' and 'mass awakening of consciousness' directly echo the book's concepts. However, some phrases are slightly more generic, which prevents a perfect score.

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sobre el despertar espiritual.
- EN: pagina — Voz directa y reflexiones sobre el crecimiento personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.92 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.92**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9992
- Tiempo total: 28.8s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 5561ms
- anchors: 2438 tokens, 6060ms
- palette: 0 tokens, 0ms
- content_es: 2656 tokens, 5888ms
- judge_es: 996 tokens, 1946ms
- content_en: 2096 tokens, 4847ms
- judge_en: 939 tokens, 3833ms
- voice: 867 tokens, 698ms
