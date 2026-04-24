# Quality Report — Estoicismo cotidiano

**Autor:** Ryan Holiday & Stephen Hanselman
**Ejecutado:** 2026-04-24T03-08-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.94
- **Resolution path:** evidence_fetched_2sources
- **Match score:** 0.97



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Controla tus percepciones. Dirige tus acciones adecuadamente. Acepta con voluntad lo que escapa a tu control. ¿Por qué las mentes más grandes de la historia como George Washington, Ralph Waldo Emerson, los directores de grandes compañías y entrenadores deportivos han adoptado el pensamiento de los antiguos estoicos? Es sencillo: todos ellos se han dado cuenta de que la sabiduría más valiosa es atemporal, y que la filosofía es un camino para mejorar nuestra vida día a día. Estoicismo cotidiano ofrece ideas y citas de Marco Aurelio, Séneca, Cicerón, Diógenes y Epicteto, entre otros pensadores, para todos los días del año. Aquí encontrarás frases de gran alcance, anécdotas históricas y comentarios provocativos para afrontar la adversidad y dar lo mejor de ti m...
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- controlar tus percepciones
- dirigir tus acciones adecuadamente
- aceptar lo que escapa a tu control
- sabiduría atemporal
- afrontar la adversidad

**Key terms:** estoicismo, percepción, acción, adversidad, sabiduría

**Voz autorial:** La voz autorial es reflexiva y motivacional, combinando citas históricas con consejos prácticos para la vida diaria.

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
- Razón: The generated content directly reflects key concepts from the book 'Estoicismo cotidiano', such as the importance of accepting what is beyond our control and focusing on our perceptions and actions. Phrases like 'Aceptar lo que no puedes controlar' and 'Controlar tus percepciones' are explicitly aligned with the book's themes and teachings from Stoic philosophers, making it highly specific and not

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of acceptance and control found in Stoic philosophy, which is central to the book 'Estoicismo cotidiano.' It incorporates specific concepts such as 'accept what you cannot control' and 'direct your actions,' reflecting the teachings of Stoic thinkers mentioned in the ground truth. However, while it is specific to Stoicism, some phrases could be,

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones en primera persona sobre el tema.
- EN: pagina — Voz directa y reflexiones sobre el control personal.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.94 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.95 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.93**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9252
- Tiempo total: 61.6s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42648ms
- anchors: 2307 tokens, 4716ms
- palette: 0 tokens, 0ms
- content_es: 2491 tokens, 5519ms
- judge_es: 865 tokens, 2073ms
- content_en: 1930 tokens, 3858ms
- judge_en: 832 tokens, 1834ms
- voice: 827 tokens, 910ms
