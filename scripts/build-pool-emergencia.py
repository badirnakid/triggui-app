#!/usr/bin/env python3
# 🛟 build-pool-emergencia.py — fabrica musica_emergencia.json (el cajón "jamás silencio")
# Cada pieza: curada a mano, resuelta en iTunes (mx→us), vetada, preview verificado HTTP 200.
# Salida: candidatas COMPLETAS en el esquema de producción (13 llaves, mismo orden).
import json, re, sys, time, urllib.request, urllib.parse, concurrent.futures, datetime

VETO = re.compile(r"karaoke|tribute|8.?bit|cover band|made famous|originally performed|ringtone", re.I)
EJE_META = {
    "calma":   {"rol": "aterrizar",  "frase_eco": "respira; la página espera",
                "pie": "Refugio en calma — pieza elegida a mano para leer sin prisa."},
    "enfoque": {"rol": "profundizar","frase_eco": "una idea a la vez",
                "pie": "Refugio de enfoque — pieza elegida a mano para pensar claro."},
    "impulso": {"rol": "abrir",      "frase_eco": "un paso más",
                "pie": "Refugio de impulso — pieza elegida a mano para arrancar."},
    "luz":     {"rol": "resonar",    "frase_eco": "qué bonito es leer esto",
                "pie": "Refugio de luz — pieza elegida a mano para sonreír leyendo."},
}
KIDS_ECO = {"calma": "shhh… la historia sigue", "enfoque": "mira qué curioso",
            "impulso": "¡vamos, aventura!", "luz": "¡qué divertido!"}

ADULTO = {
 "calma": [("Erik Satie","Gymnopédie No. 1"),("Arvo Pärt","Spiegel im Spiegel"),
           ("Claude Debussy","Clair de Lune"),("Yo-Yo Ma","Cello Suite No. 1 Prélude"),
           ("Frédéric Chopin","Nocturne Op. 9 No. 2"),("Max Richter","On the Nature of Daylight"),
           ("Erik Satie","Gnossienne No. 1")],
 "enfoque": [("Philip Glass","Metamorphosis One"),("Nils Frahm","Says"),
             ("Ólafur Arnalds","Near Light"),("Glenn Gould","Goldberg Variations Aria"),
             ("Brian Eno","An Ending Ascent"),("Ludovico Einaudi","Experience"),
             ("Pat Metheny","Electric Counterpoint Fast")],
 "impulso": [("Hans Zimmer","Time"),("Ennio Morricone","The Ecstasy of Gold"),
             ("Vangelis","Chariots of Fire"),("Rodrigo y Gabriela","Tamacun"),
             ("Yoshida Brothers","Rising"),("Ramin Djawadi","Light of the Seven"),
             ("Jóhann Jóhannsson","Flight from the City")],
 "luz": [("Vince Guaraldi Trio","Linus and Lucy"),("Yann Tiersen","Comptine d'un autre été"),
         ("Penguin Cafe Orchestra","Perpetuum Mobile"),("Django Reinhardt","Minor Swing"),
         ("Joe Hisaishi","Summer"),("Bill Evans","Peace Piece"),
         ("Vince Guaraldi Trio","Skating")],
}
KIDS = {
 "calma": [("Claude Debussy","Clair de Lune"),("Joe Hisaishi","The Path of the Wind"),
           ("Erik Satie","Gymnopédie No. 1"),("Camille Saint-Saëns","The Swan"),
           ("Edvard Grieg","Morning Mood")],
 "enfoque": [("Wolfgang Amadeus Mozart","Eine kleine Nachtmusik Allegro"),
             ("Antonio Vivaldi","Spring Allegro"),("Pyotr Ilyich Tchaikovsky","Dance of the Sugar Plum Fairy"),
             ("Camille Saint-Saëns","Aquarium"),("Ludwig van Beethoven","Für Elise")],
 "impulso": [("Edvard Grieg","In the Hall of the Mountain King"),
             ("Nikolai Rimsky-Korsakov","Flight of the Bumblebee"),("Paul Dukas","The Sorcerer's Apprentice"),
             ("Gioachino Rossini","William Tell Overture"),("Aram Khachaturian","Sabre Dance")],
 "luz": [("Vince Guaraldi Trio","Linus and Lucy"),("Leroy Anderson","Plink Plank Plunk"),
         ("Leroy Anderson","The Typewriter"),("Joe Hisaishi","Merry-Go-Round of Life"),
         ("Pyotr Ilyich Tchaikovsky","Waltz of the Flowers")],
}

def toks(s): return set(re.findall(r"[a-záéíóúüñö]+", s.lower()))
def busca(artista, pieza):
    q = urllib.parse.quote(f"{artista} {pieza}")
    for pais in ("mx", "us"):
        url = f"https://itunes.apple.com/search?term={q}&media=music&entity=song&limit=12&country={pais}"
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                res = json.load(r).get("results", [])
        except Exception:
            res = []
        mejores = []
        for x in res:
            tn, an = x.get("trackName",""), x.get("artistName","")
            if VETO.search(tn + " " + (x.get("collectionName") or "") + " " + an): continue
            if not x.get("previewUrl"): continue
            dur = int((x.get("trackTimeMillis") or 0)/1000)
            if not (45 <= dur <= 900): continue
            score = len(toks(pieza) & toks(tn))*2 + len(toks(artista) & toks(an))
            if toks(artista) & toks(an): score += 2
            mejores.append((score, x, dur))
        if mejores:
            mejores.sort(key=lambda t: -t[0])
            if mejores[0][0] >= 3: return mejores[0][1], mejores[0][2]
    return None, None

def cand(x, dur, eje, kids):
    m = EJE_META[eje]
    return {"id": str(x.get("trackId") or ""), "cancion": (x.get("trackName") or "")[:90],
            "artista": (x.get("artistName") or "")[:70], "album": (x.get("collectionName") or "")[:90],
            "genero": (x.get("primaryGenreName") or "")[:30], "dur": dur,
            "preview": x.get("previewUrl"), "link": x.get("trackViewUrl") or "",
            "art": (x.get("artworkUrl100") or "").replace("100x100bb", "600x600bb"),
            "armonia": 5, "rol": m["rol"], "pie": m["pie"],
            "frase_eco": (KIDS_ECO[eje] if kids else m["frase_eco"])}

def resuelve(tabla, kids):
    out, fallos = {}, []
    for eje, piezas in tabla.items():
        lst = []
        for artista, pieza in piezas:
            x, dur = busca(artista, pieza)
            if x: lst.append(cand(x, dur, eje, kids)); print(f"  ✓ {eje:8} {pieza[:34]:34} → {x['artistName'][:26]}")
            else: fallos.append((eje, artista, pieza)); print(f"  ✗ {eje:8} {pieza[:34]:34} SIN MATCH")
            time.sleep(0.35)
        vist=set(); lst=[c for c in lst if not (c["id"] in vist or vist.add(c["id"]))]
        out[eje] = lst
    return out, fallos

def vivo(u):
    try:
        rq = urllib.request.Request(u, method="HEAD")
        with urllib.request.urlopen(rq, timeout=12) as r: return r.status == 200
    except Exception: return False

def main():
    print("— ADULTO —"); ejes, f1 = resuelve(ADULTO, False)
    print("— KIDS —");   kids, f2 = resuelve(KIDS, True)
    for eje, lst in ejes.items(): assert len(lst) >= 5, f"adulto/{eje}: solo {len(lst)}"
    for eje, lst in kids.items(): assert len(lst) >= 4, f"kids/{eje}: solo {len(lst)}"
    urls = sorted({c["preview"] for l in list(ejes.values())+list(kids.values()) for c in l})
    with concurrent.futures.ThreadPoolExecutor(16) as ex: res = list(ex.map(vivo, urls))
    assert all(res), f"previews muertos: {sum(1 for r in res if not r)}"
    doc = {"version": "1.0", "fecha": datetime.date.today().isoformat(),
           "nota": "Cajón de emergencia curado — jamás silencio. Editable a mano; el resolutor lo usa cuando capa1+rescates fallan.",
           "ejes": ejes, "kids": kids}
    out = sys.argv[1] if len(sys.argv) > 1 else "musica_emergencia.json"
    json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    n = sum(len(l) for l in list(ejes.values())+list(kids.values()))
    print(f"\n🛟 {out}: {n} piezas · previews vivos {sum(res)}/{len(urls)} · fallos de match: {len(f1)+len(f2)}")
    for f in f1+f2: print("   ✗", *f)

if __name__ == "__main__":
    main()
