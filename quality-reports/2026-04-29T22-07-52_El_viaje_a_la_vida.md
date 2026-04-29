# Quality Report — El viaje a la vida

**Autor:** Eduardo Punset
**Ejecutado:** 2026-04-29T22-07-52
**Pipeline:** nucleus-canonical-v3.7.1

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

Cómo la empatía y la intuición cambiarán nuestro futuro. Hasta hace muy pocos años, los humanos vivíamos en núcleos muy reducidos e incomunicados;&#xa0;el amor, la amistad o la comprensión eran una excepción, y había obstáculos&#xa0;insalvables entre las distintas comunidades. La empatía nació en el cerebro de los humanos hace cien mil años, pero está irrumpiendo&#xa0;de manera imparable en el hogar, las comunidades y las empresas. Gradualmente,&#xa0;la sociedad está aprendiendo, gracias a las redes sociales y a la propagación de la empatía,&#xa0;a cuidar de sí misma y a no necesitar de las ayudas interesadas de terceros. Algún&#xa0;día, ya nadie dudará de que la mejor manera de ser feliz será haciendo feliz a los demás.

METADATA VERIFICADA:
- Título: El v...
```

---

## 🖼️ Portada

- **Source:** `n/a`




---

## ⚓ Anchors extraídos

**Conceptos:**
- la empatía como motor de cambio social
- la intuición para mejorar nuestras relaciones
- la autogestión emocional en la era digital
- la felicidad a través de la felicidad ajena
- la evolución de la comunicación humana

**Key terms:** empatía, intuición, autogestión, felicidad, comunicación

**Voz autorial:** La voz de Eduardo Punset es reflexiva y esperanzadora, invitando a la introspección y a la acción social a través de la empatía.

---

## 🎨 Visual synthesis

- hue_primary: 140
- saturation: balanced
- lightness_paper: medium_light
- temperature_shift: 0
- palette_strategy: analogous
- typography: sans_humanista
- Resultado: paper=#CFD3D0, accent=#1FD65C, ink=#171C19, contraste=11.41:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 1.00
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content directly references empathy as a transformative force, aligning with the book's focus on how empathy and intuition can change our future. Phrases like 'la empatía transforma relaciones y sociedades' and 'felicidad compartida' echo the book's themes, making it specific to 'El viaje a la vida'.

### EN
- Score: 0.80
- Usa conceptos específicos: true
- Razón: The generated content closely aligns with the themes of empathy and social change presented in the book's synopsis. It emphasizes empathy as a transformative force in human relationships and communities, which is a central concept in the book. However, some phrases are somewhat generic and could apply to other self-help contexts, slightly reducing the score.



---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Uso de voz directa y enfoque en la empatía sin referencias externas.
- EN: pagina — Tono directo y reflexivo, sin referencias meta.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.95 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.82 ← anti-genericidad de anchors
- **grounding_judge:** 0.9 ← promedio de los 2 judges
- **Combined:** **0.9**

---

## ✅ Validación final

**Overall:** `pass_with_warnings`

**Warnings:**
- highlights_auto_corrected_v3.7: 2 highlight(s) extendidos a frase completa por LLM judge

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 9194
- Tiempo total: 28.9s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 10037ms
- anchors: 2351 tokens, 5365ms
- palette: 0 tokens, 0ms
- content_es: 2476 tokens, 3968ms
- judge_es: 839 tokens, 1861ms
- content_en: 1908 tokens, 4677ms
- judge_en: 822 tokens, 1805ms
- voice: 798 tokens, 803ms
- highlight_judge_es_parrafoTop: 647 tokens, 0ms
- highlight_judge_es_parrafoBot: 650 tokens, 0ms
- highlight_judge_es_parrafoBot_retry: 653 tokens, 0ms
- highlight_judge_en_parrafoTop: 651 tokens, 0ms
- highlight_judge_en_parrafoTop_retry: 644 tokens, 0ms
- highlight_judge_en_parrafoBot: 640 tokens, 0ms
