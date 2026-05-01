# Quality Report — Cartas para un ciego que creía ver

**Autor:** Santiago Molano
**Ejecutado:** 2026-05-01T18-35-40
**Pipeline:** nucleus-canonical-v3.7.1

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.95
- **Resolution path:** evidence_fetched_1sources
- **Match score:** 1.00



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

Deja de ser víctima y conviértete en el protagonista de tu vida. Soñamos con cambiar el mundo y creemos que todo lo malo viene del exterior, sin entender que es dentro de nosotros que debe iniciar cualquier transformación. Este libro busca ayudarnos a cambiar la narrativa de víctima para asumir la responsabilidad sobre las decisiones que hemos tomado y que han definido nuestra vida. Es un llamado a observarnos en el espejo, con objetividad, pues solo así podremos hacernos cargo de nosotros mismos. Santiago Molano es un convencido de que en la propia historia se encuentra la clave para despertar. Por eso, a través de cartas dirigidas a su Querido Santiago, busca hacer un ejercicio de autoconocimiento en el que nos invita a reflexionar para entender quién es ...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- cambiar la narrativa de víctima
- asumir la responsabilidad personal
- ejercicio de autoconocimiento
- reflexionar sobre la propia historia
- despertar interior

**Key terms:** narrativa, responsabilidad, autoconocimiento, reflexión, transformación

**Voz autorial:** La voz de Santiago Molano es introspectiva y reflexiva, invitando al lector a un viaje personal hacia la autocomprensión y el empoderamiento.

---

## 🎨 Visual synthesis

- hue_primary: 65
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#D3D3CF, accent=#C7D61F, ink=#1B1C17, contraste=11.42:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The generated content directly reflects the core themes of the book, such as personal responsibility, transformation from victimhood to protagonism, and the importance of self-reflection. Phrases like 'cambiar la narrativa de víctima' and 'reflexionar sobre la propia historia' are explicitly tied to the book's message, making it highly specific and anchored to the ground truth.

### EN
- Score: 1.00
- Usa conceptos específicos: true
- Razón: The content directly reflects the core themes of personal responsibility and transformation from the book's synopsis. Phrases like 'victim narrative' and 'inner awakening' align closely with the author's message about self-reflection and taking charge of one's life. It is specific to the book's concepts and not generic.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones personales sin referencias externas.
- EN: pagina — Voz directa y reflexiva, sin referencias externas al libro.

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
- Tokens totales: 9481
- Tiempo total: 39.0s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 16334ms
- anchors: 2501 tokens, 6141ms
- palette: 0 tokens, 0ms
- content_es: 2499 tokens, 6074ms
- judge_es: 890 tokens, 2160ms
- content_en: 1930 tokens, 4803ms
- judge_en: 869 tokens, 1896ms
- voice: 792 tokens, 1004ms
- highlight_judge_es_parrafoTop: 645 tokens, 0ms
- highlight_judge_es_parrafoBot: 643 tokens, 0ms
- highlight_judge_en_parrafoTop: 641 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
