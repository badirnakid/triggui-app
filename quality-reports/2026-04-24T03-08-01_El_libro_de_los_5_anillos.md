# Quality Report — El libro de los 5 anillos

**Autor:** Miyamoto Musashi
**Ejecutado:** 2026-04-24T03-08-01
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** `apple_books`
- **Tier reached:** 2
- **Book identity confidence:** 0.91
- **Resolution path:** evidence_fetched_3sources
- **Match score:** 0.91



### Ground truth utilizado
```
SINOPSIS OFICIAL (Apple Books):

El Libro de los Cinco Anillos (en japonés Go-rin no sho) es un tratado sobre el Kenjutsu escrito por Miyamoto Musashi en su vejez, durante su retiro de ermitaño en la Cueva de Reigendo en 1643, y finalizado el 19 de mayo de 1645, pocas semanas antes de su muerte. El libro está dedicado a su pupilo Terao Magonojo.

METADATA VERIFICADA:
- Título: El Libro de los Cinco Anillos
- Autor: Miyamoto Musashi
- Año: 1980
- Categorías: Ficción y literatura, Libros
```

---

## ⚓ Anchors extraídos

**Conceptos:**
- estrategia en la batalla
- filosofía del Kenjutsu
- la importancia de la mente en la lucha
- el camino del guerrero
- la búsqueda de la perfección personal

**Key terms:** Kenjutsu, estrategia, samuráis, tácticas, espíritu guerrero

**Voz autorial:** La voz de Musashi es reflexiva y profunda, combinando enseñanzas prácticas sobre el combate con una filosofía de vida que trasciende la guerra.

---

## 🎨 Visual synthesis

- hue_primary: 200
- saturation: muted
- lightness_paper: medium_dark
- temperature_shift: 0
- palette_strategy: monochromatic
- typography: serif_clasico
- Resultado: paper=#44494B, accent=#6EAECF, ink=#EEF0F1, contraste=7.99:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: 0.80
- Usa conceptos específicos: true
- Podría aplicar a cualquier libro: false
- Razón: The content reflects specific concepts from 'El Libro de los Cinco Anillos', particularly the focus on the mind and spirit in battle, which aligns with Musashi's teachings on Kenjutsu. Phrases like 'La verdadera esencia del Kenjutsu reside en la mente' and 'La batalla no se lleva a cabo solo con la espada' are directly related to the book's themes. However, some phrases are more philosophical and,

### EN
- Score: 0.70
- Usa conceptos específicos: true
- Razón: The content reflects concepts from 'El Libro de los Cinco Anillos' by discussing the mental aspects of Kenjutsu and the importance of inner peace and clarity in battle, which are central themes in Musashi's philosophy. However, while it is anchored in the book's themes, the language is somewhat generic and could apply to broader martial arts or self-improvement contexts, which slightly detracts it

---

## 🎭 Voice verdict

- Consolidated: **pagina** (conf 0.90)
- ES: pagina — Voz directa y reflexiones sobre la práctica del Kenjutsu.
- EN: pagina — Voz directa y reflexiones sobre la práctica del Kenjutsu.

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** 0.91 ← del tier de grounding alcanzado
- **voice_authenticity:** 0.93 ← del voice judge
- **specificity:** 0.9 ← anti-genericidad de anchors
- **grounding_judge:** 0.75 ← promedio de los 2 judges
- **Combined:** **0.86**

---

## ✅ Validación final

**Overall:** `pass`
Sin warnings.

---

## 💰 Métricas

- LLM calls: 7
- Tokens totales: 8887
- Tiempo total: 64.2s
- Modelos usados: gpt-4o-mini-2024-07-18

### Por fase
- grounding: 0 tokens, 42548ms
- anchors: 2217 tokens, 4547ms
- palette: 0 tokens, 0ms
- content_es: 2418 tokens, 7943ms
- judge_es: 794 tokens, 2119ms
- content_en: 1856 tokens, 4228ms
- judge_en: 741 tokens, 2127ms
- voice: 861 tokens, 678ms
