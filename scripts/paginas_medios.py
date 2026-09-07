#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════════
# paginas_medios.py — las dos páginas de medios de una edición, con la identidad de la hélice
#   /t/<slug>/pieza/   → la melodía (30 s): vinilo grande con aro de progreso, justificación, badge Apple
#   /t/<slug>/video/   → el video, dentro de Triggui: fachada con ▶, al tocar se inyecta el reproductor
# Tokens (calco de /espiral): --bg #0B0F1A · tinta #F5F0E8 · faint #77716a · line #232838 · Manrope · acento = colores[0]
# Reglas: bilingüe en runtime (triggui_lang / navigator), ?w=s|c → utm antes de GA, primer toque = play, sin autoplay fingido.
# ═══════════════════════════════════════════════════════════════════════════════
import html, json
from pathlib import Path

LOGO = "https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletrasblanco2.png"
GA = "G-CLK554FCNM"

def _E(v): return html.escape(str(v or ""), quote=True)
def _J(v): return json.dumps(v if v is not None else "", ensure_ascii=False)

def _expansor(slug):
    return ("<script>(function(){try{var q=new URLSearchParams(location.search),w=q.get('w');if(!w||q.get('utm_source'))return;"
            "var med={s:'sala',c:'compartir',e:'lunes'}[w];if(!med)return;q.delete('w');q.set('utm_source',w==='e'?'email':'whatsapp');q.set('utm_medium',med);"
            "q.set('utm_campaign'," + _J(slug) + ");history.replaceState(null,'',location.pathname+'?'+q.toString()+location.hash);}catch(e){}})();</script>")

def _ga():
    return (f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA}"></script>'
            "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());"
            f"gtag('config','{GA}');</script>")

def _base_css(acc):
    return f"""
:root{{--bg:#0B0F1A;--ink:#F5F0E8;--faint:#77716a;--line:#232838;--acc:{_E(acc)}}}
*{{box-sizing:border-box}}html,body{{margin:0;min-height:100%;background:var(--bg)}}
body{{font-family:'Manrope',system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;min-height:100dvh;display:flex;flex-direction:column;padding:calc(14px + env(safe-area-inset-top)) 21px calc(22px + env(safe-area-inset-bottom))}}
.hud{{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}}.hud img{{height:16px;display:block;opacity:.95}}
.sem{{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--faint);font-weight:700}}
.sem.acc{{color:var(--acc)}}
main{{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px 0 6px;cursor:pointer;-webkit-tap-highlight-color:transparent}}
.tit{{font-size:20px;line-height:1.35;letter-spacing:.01em;margin:14px 0 4px;color:var(--ink);font-weight:700}}
.sub{{font-size:13px;color:var(--faint);font-weight:600;margin:0}}
.hoja{{width:100%;max-width:440px;margin:22px auto 0;border-top:1px solid var(--line);padding-top:16px;text-align:left}}
.hoja p{{margin:8px 0 16px;font-size:15px;line-height:1.55;color:rgba(245,240,232,.9);font-weight:500}}
.acts{{display:flex;gap:10px;align-items:center;flex-wrap:wrap}}
.pill{{flex:1;display:flex;align-items:center;justify-content:center;font:800 10.5px/1.2 'Manrope',sans-serif;letter-spacing:.06em;color:var(--acc);text-decoration:none;padding:12px 10px;border-radius:999px;border:2px solid var(--line);text-align:center;text-transform:uppercase;transition:border-color .2s}}
.pill:hover{{border-color:var(--acc)}}.pill.g{{color:var(--faint)}}
.badge img{{height:36px;display:block}}
.foot{{margin-top:18px;text-align:center}}.foot .sem b{{color:var(--ink)}}
.hint{{font-size:12px;color:var(--faint);font-weight:600;min-height:16px;margin-top:10px}}
"""

# ─────────────────────────────── 🎧 PIEZA ───────────────────────────────
def escribir_pieza(libro, out_dir, slug, base_url):
    """Escribe <out_dir>/pieza/index.html si el libro tiene música con preview. Devuelve True si la escribió."""
    m = (libro.get("_musica") or {}).get("candidatos") or []
    cands = [x for x in m if x.get("preview")][:3]
    c = cands[0] if cands else None
    if not c:
        return False
    CANDS = [{"cancion": x.get("cancion", ""), "artista": x.get("artista", ""), "pie": x.get("pie", ""), "preview": x.get("preview", ""),
              "art": (x.get("art") or "").replace("100x100bb", "600x600bb"), "link": x.get("link", "")} for x in cands]
    kids = "kids" in str(out_dir)
    ruta = f"{base_url}/kids/t/{slug}" if kids else f"{base_url}/t/{slug}"
    col = libro.get("colores") or []
    acc = col[0] if col else "#E8A838"
    titulo = libro.get("titulo", ""); tit_en = libro.get("titulo_en") or titulo
    numero = libro.get("_edicion_numero")
    cancion = c.get("cancion", ""); artista = c.get("artista", ""); pie = c.get("pie", "")
    art = (c.get("art") or "").replace("100x100bb", "600x600bb")
    hay_video = bool(not kids and ((libro.get("_video") or {}).get("candidatos") or []))
    page = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
{_expansor(slug)}
{_ga()}
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{_E(cancion)} — {_E(artista)} · 30 segundos · Triggui</title>
<meta name="description" content="{_E(pie)}">
<link rel="canonical" href="{ruta}/pieza/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Triggui">
<meta property="og:title" content="{_E(cancion)} — {_E(artista)}">
<meta property="og:description" content="{_E(pie)}">
<meta property="og:image" content="{ruta}/pieza_og.jpg">
<meta property="og:image:secure_url" content="{ruta}/pieza_og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:url" content="{ruta}/pieza/">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B0F1A">
<link rel="icon" href="{base_url}/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{_base_css(acc)}
.vin{{position:relative;width:min(240px,64vw);height:min(240px,64vw);border-radius:50%;margin:10px auto 0;cursor:pointer;-webkit-tap-highlight-color:transparent}}
.aro{{position:absolute;inset:-7px;border-radius:50%;background:conic-gradient(var(--acc) var(--vh-p,0%),rgba(255,255,255,.14) 0);transition:opacity .3s}}
.aro:after{{content:'';position:absolute;inset:7px;border-radius:50%;background:var(--bg)}}
.art{{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover;box-shadow:0 26px 70px rgba(0,0,0,.6);animation:giro 16s linear infinite;animation-play-state:paused}}
.tocando .art{{animation-play-state:running}}
@keyframes giro{{to{{transform:rotate(360deg)}}}}
.cometa{{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--ink);box-shadow:0 0 16px var(--acc),0 0 3px #fff;transform:rotate(var(--ang,0deg)) translateY(calc(min(240px,64vw) / -2 - 7px));opacity:0;transition:opacity .3s}}
.tocando .cometa{{opacity:1}}
.nuc{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34%;height:24%;border-radius:22%/34%;background:var(--acc);display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.14);animation:latido 3.2s ease-in-out .9s infinite}}
@keyframes latido{{0%,100%{{transform:translate(-50%,-50%) scale(1)}}50%{{transform:translate(-50%,-50%) scale(1.06)}}}}
.tocando .nuc{{animation:none}}
.nuc svg{{width:46%;height:70%;fill:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}}.nuc .ir{{transform:translateX(6%)}}.nuc .pausa{{display:none}}
.dots{{display:flex;gap:8px;justify-content:center;margin-top:14px}}.dots button{{width:8px;height:8px;border-radius:50%;border:0;padding:0;background:rgba(255,255,255,.22);cursor:pointer}}.dots button.on{{background:var(--acc);box-shadow:0 0 10px var(--acc)}}
.tocando .nuc .pausa{{display:block}}.tocando .nuc .ir{{display:none}}
.nada .art{{filter:grayscale(.4) brightness(.8)}}
</style>
</head>
<body>
<div class="hud"><img src="{LOGO}" alt="Triggui"><span class="sem" id="hudSem">{("EDICIÓN · #" + str(numero)) if numero else "TRIGGUI"}</span></div>
<main id="card">
  <div class="vin" id="vin" role="button" aria-label="Reproducir">
    <div class="aro" id="aro"></div>
    {"<img class='art' id='art' src='" + _E(art) + "' alt=''>" if art else "<div class='art' style='display:flex;align-items:center;justify-content:center;font-size:72px;background:#151b2c'>🎧</div>"}
    <div class="cometa" id="cometa"></div>
    <div class="nuc"><svg class="ir" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg><svg class="pausa" viewBox="0 0 24 24"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.6z"/></svg></div>
  </div>
  <div class="dots" id="dots" aria-label="Otras melodías de esta edición"></div>
  <div class="sem" id="kicker" style="margin-top:16px">🎧 Toca para escuchar · 30 segundos</div>
  <h1 class="tit">{_E(cancion)}</h1>
  <p class="sub">{_E(artista)}</p>
  <div class="hint" id="hint"></div>
  <div class="hoja">
    <div class="sem" id="porque">Por qué esta melodía</div>
    <p id="pie">{_E(pie)}</p>
    <div class="acts">
      <a class="pill" id="abrir" href="{ruta}/?w=s">Ver la edición →</a>
      {"<a class='pill g' id='video' href='" + ruta + "/video/?w=s'>🎬 Su video</a>" if hay_video else ""}
      <a class="badge" id="badge" href="{_E(c.get('link', ''))}" target="_blank" rel="noopener noreferrer" aria-label="Apple Music"><img id="badgeImg" src="https://tools.applemediaservices.com/api/badges/listen-on-apple-music/badge/es-mx" alt="Apple Music"></a>
    </div>
  </div>
  <div class="foot"><span class="sem">Triggui · <b id="footLibro">{_E(titulo)}</b></span></div>
</main>
<script>
(function(){{
  var en=(function(){{try{{var v=JSON.parse(localStorage.getItem('triggui_lang')||'null');if(v==='en'||v==='es')return v==='en';}}catch(e){{}}return ((navigator.language||'es').slice(0,2)==='en');}})();
  var T=en?{{k:'🎧 Tap to listen · 30 seconds',s:'🎧 Playing · 30 seconds to read',p:'Paused',a:'Again? Tap the vinyl',e:'This preview is not available right now',pq:'Why this melody',v:'Open the edition →',vd:'🎬 Its video',ed:'EDITION · #'}}:{{k:'🎧 Toca para escuchar · 30 segundos',s:'🎧 Sonando · 30 segundos para leer',p:'En pausa',a:'¿Otra vez? Toca el vinilo',e:'Este preview no está disponible ahora',pq:'Por qué esta melodía',v:'Ver la edición →',vd:'🎬 Su video',ed:'EDICIÓN · #'}};
  /* 🔁 rotación: cada visita trae la siguiente melodía curada de la edición (3), y los puntos permiten cambiarla a mano */
  var C={_J(CANDS)},idx=0;try{{var qm=parseInt(new URLSearchParams(location.search).get('m')||'',10);var kk='tg_rot_p_'+{_J(slug)};if(!isNaN(qm)&&qm>=0&&qm<C.length){{idx=qm;}}else{{var v=parseInt(localStorage.getItem(kk)||'-1',10);idx=((isNaN(v)?-1:v)+1)%C.length;}}localStorage.setItem(kk,String(idx));}}catch(e){{idx=0;}}
  var $=function(i){{return document.getElementById(i);}};
  if(en){{document.documentElement.lang='en';$('kicker').textContent=T.k;$('porque').textContent=T.pq;$('abrir').textContent=T.v;$('abrir').href={_J(ruta + "/en/?w=s")};if($('video')){{$('video').textContent=T.vd;}}$('badgeImg').src='https://tools.applemediaservices.com/api/badges/listen-on-apple-music/badge/en-us';$('footLibro').textContent={_J(tit_en)};{("$('hudSem').textContent=T.ed+" + _J(str(numero)) + ";") if numero else ""}}}
  var cur=C[idx]||C[0];
  function pintaCand(){{var art=$('art');if(art&&cur.art)art.src=cur.art;document.querySelector('.tit').textContent=cur.cancion;document.querySelector('.sub').textContent=cur.artista;$('pie').textContent=cur.pie||'';$('badge').href=cur.link||'#';document.title=cur.cancion+' — '+cur.artista+' · Triggui';
    var d=$('dots');d.innerHTML='';C.forEach(function(x,i){{var b=document.createElement('button');b.className=i===idx?'on':'';b.setAttribute('aria-label',x.cancion);b.addEventListener('click',function(ev){{ev.stopPropagation();if(i===idx)return;idx=i;cur=C[idx];try{{localStorage.setItem('tg_rot_p_'+{_J(slug)},String(idx));}}catch(e){{}}var estaba=!au.paused;au.pause();au.src=cur.preview;sono=false;pausado=false;aro.style.setProperty('--vh-p','0%');pintaCand();if(estaba)play();else ui(false);}});d.appendChild(b);}});}}
  var au=new Audio(cur.preview);au.preload='auto';var card=$('card'),aro=$('aro'),cometa=$('cometa'),kick=$('kicker'),hint=$('hint');
  pintaCand();
  var sono=false,pausado=false,fade=null;
  function ui(p){{card.classList.toggle('tocando',p);kick.textContent=p?T.s:T.k;kick.classList.toggle('acc',p);$('vin').setAttribute('aria-label',p?(en?'Pause':'Pausa'):(en?'Play':'Reproducir'));}}
  var arrancando=false;
  function play(){{if(fade){{clearInterval(fade);fade=null;}}au.volume=1;arrancando=true;kick.textContent=en?'🎧 Loading…':'🎧 Cargando…';
    return au.play().then(function(){{arrancando=false;ui(true);hint.textContent='';if(!sono){{sono=true;try{{gtag('event','musica_play',{{contexto:'pieza',slug:{_J(slug)},cancion:cur.cancion,artista:cur.artista,indice:idx}});}}catch(e){{}}}}
    try{{if('mediaSession' in navigator){{navigator.mediaSession.metadata=new MediaMetadata({{title:cur.cancion,artist:cur.artista,album:{_J(titulo)},artwork:cur.art?[{{src:cur.art,sizes:'600x600',type:'image/jpeg'}}]:[]}});}}}}catch(e){{}}}}).catch(function(){{arrancando=false;ui(false);}});}}
  au.addEventListener('playing',function(){{arrancando=false;ui(true);}});
  function toggle(){{if(arrancando)return;if(au.paused){{pausado=false;play();}}else{{pausado=true;au.pause();ui(false);hint.textContent=T.p;}}}}
  $('vin').addEventListener('click',function(ev){{ev.stopPropagation();toggle();}});
  /* iOS entrega click solo en zonas con cursor:pointer/manejador: el escenario entero (main) es el manejador; el primer toque en cualquier parte arranca */
  var arranque=function(ev){{if(ev.target&&ev.target.closest&&ev.target.closest('a,#vin'))return;if(au.paused&&!pausado&&!arrancando){{play();}}}};
  card.addEventListener('click',arranque);
  document.addEventListener('touchend',function primero(ev){{if(ev.target&&ev.target.closest&&ev.target.closest('a,#vin'))return;if(au.paused&&!pausado&&!arrancando&&!sono){{play();}}document.removeEventListener('touchend',primero,true);}},true);
  au.addEventListener('timeupdate',function(){{var t=au.currentTime,p=Math.min(1,t/30);aro.style.setProperty('--vh-p',(p*100)+'%');cometa.style.setProperty('--ang',(p*360)+'deg');if(t>=28&&!fade){{var v=1;fade=setInterval(function(){{v-=.1;if(v<=0){{clearInterval(fade);fade=null;}}else au.volume=Math.max(0,v);}},180);}}}});
  au.addEventListener('ended',function(){{ui(false);aro.style.setProperty('--vh-p','100%');hint.textContent=T.a;au.currentTime=0;au.volume=1;}});
  au.addEventListener('error',function(){{card.classList.add('nada');hint.textContent=T.e;}});
  play();
}})();
</script>
</body>
</html>"""
    d = Path(out_dir) / "pieza"
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(page, encoding="utf-8")
    return True

# ─────────────────────────────── 🎬 VIDEO ───────────────────────────────
def escribir_video(libro, out_dir, slug, base_url):
    """Escribe <out_dir>/video/index.html si el libro (adulto) tiene video. Devuelve True si la escribió."""
    if "kids" in str(out_dir):
        return False
    vs = (libro.get("_video") or {}).get("candidatos") or []
    vc = [x for x in vs if x.get("id")][:3]
    v = vc[0] if vc else None
    if not v:
        return False
    VCANDS = [{"id": x.get("id"), "titulo": x.get("titulo", ""), "canal": x.get("canal", ""), "dur": int(x.get("dur") or 0), "pie": x.get("pie") or "", "pie_en": x.get("pie_en") or (x.get("pie") or "")} for x in vc]
    ruta = f"{base_url}/t/{slug}"
    col = libro.get("colores") or []
    acc = col[0] if col else "#E8A838"
    titulo = libro.get("titulo", ""); tit_en = libro.get("titulo_en") or titulo
    numero = libro.get("_edicion_numero")
    vid = v.get("id"); vtit = v.get("titulo", ""); canal = v.get("canal", ""); dur = int(v.get("dur") or 0)
    pie = v.get("pie") or ""; pie_en = v.get("pie_en") or pie
    mins = f"{round(dur / 60)} min" if dur else ""
    hay_pieza = bool((libro.get("_musica") or {}).get("candidatos"))
    desc = (f"{canal} · {mins} · " if canal or mins else "") + "El video de esta edición, dentro de Triggui"
    page = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
{_expansor(slug)}
{_ga()}
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{_E(vtit)} · Triggui</title>
<meta name="description" content="{_E(pie or desc)}">
<link rel="canonical" href="{ruta}/video/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Triggui">
<meta property="og:title" content="{_E(vtit)}">
<meta property="og:description" content="{_E(desc)}">
<meta property="og:image" content="{ruta}/video_og.jpg">
<meta property="og:image:secure_url" content="{ruta}/video_og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:url" content="{ruta}/video/">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B0F1A">
<link rel="icon" href="{base_url}/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{_base_css(acc)}
.fac{{position:relative;width:100%;max-width:520px;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#000;box-shadow:0 0 0 2px var(--acc),0 26px 70px rgba(0,0,0,.6)}}
.fac iframe{{position:absolute;inset:0;width:100%;height:100%;border:0}}
.dots{{display:flex;gap:8px;justify-content:center;margin-top:14px}}.dots button{{width:8px;height:8px;border-radius:50%;border:0;padding:0;background:rgba(255,255,255,.22);cursor:pointer}}.dots button.on{{background:var(--acc);box-shadow:0 0 10px var(--acc)}}
</style>
</head>
<body>
<div class="hud"><img src="{LOGO}" alt="Triggui"><span class="sem" id="hudSem">{("EDICIÓN · #" + str(numero)) if numero else "TRIGGUI"}</span></div>
<main id="card">
  <div class="fac" id="fac">
    <iframe id="yt" src="https://www.youtube-nocookie.com/embed/{_E(vid)}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1" title="{_E(vtit)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>
  <div class="dots" id="dots" aria-label="Otros videos de esta edición"></div>
  <div class="sem" id="kicker" style="margin-top:16px">🎬 El video de la edición{(" · " + mins) if mins else ""}</div>
  <h1 class="tit">{_E(vtit)}</h1>
  <p class="sub">{_E(canal)}</p>
  <div class="hint" id="hint">Toca ▶ para verlo aquí mismo</div>
  <div class="hoja">
    <div class="sem" id="porque">Por qué este video</div>
    <p id="pie">{_E(pie)}</p>
    <div class="acts">
      <a class="pill" id="abrir" href="{ruta}/?w=s">Ver la edición →</a>
      {"<a class='pill g' id='pieza' href='" + ruta + "/pieza/?w=s'>🎧 Su melodía</a>" if hay_pieza else ""}
    </div>
  </div>
  <div class="foot"><span class="sem">Triggui · <b id="footLibro">{_E(titulo)}</b></span></div>
</main>
<script>
(function(){{
  var en=(function(){{try{{var v=JSON.parse(localStorage.getItem('triggui_lang')||'null');if(v==='en'||v==='es')return v==='en';}}catch(e){{}}return ((navigator.language||'es').slice(0,2)==='en');}})();
  var $=function(i){{return document.getElementById(i);}};
  if(en){{document.documentElement.lang='en';$('kicker').textContent='🎬 The edition\\'s video'+{_J((" · " + mins) if mins else "")};$('hint').textContent='Tap ▶ to watch it right here';$('porque').textContent='Why this video';$('pie').textContent={_J(pie_en)};$('abrir').textContent='Open the edition →';$('abrir').href={_J(ruta + "/en/?w=s")};if($('pieza'))$('pieza').textContent='🎧 Its melody';$('footLibro').textContent={_J(tit_en)};{("$('hudSem').textContent='EDITION · #'+" + _J(str(numero)) + ";") if numero else ""}}}
  /* 🔁 rotación: cada visita trae el siguiente video curado (3); los puntos permiten cambiarlo a mano */
  var V={_J(VCANDS)},vi=0;try{{var qv=parseInt(new URLSearchParams(location.search).get('v')||'',10);var vk='tg_rot_v_'+{_J(slug)};if(!isNaN(qv)&&qv>=0&&qv<V.length){{vi=qv;}}else{{var pv=parseInt(localStorage.getItem(vk)||'-1',10);vi=((isNaN(pv)?-1:pv)+1)%V.length;}}localStorage.setItem(vk,String(vi));}}catch(e){{vi=0;}}
  var vcur=V[vi]||V[0];
  function pintaV(){{var m=vcur.dur?Math.round(vcur.dur/60)+' min':'';$('kicker').textContent=(en?'🎬 The edition’s video':'🎬 El video de la edición')+(m?' · '+m:'');document.querySelector('.tit').textContent=vcur.titulo;document.querySelector('.sub').textContent=vcur.canal||'';$('pie').textContent=en?(vcur.pie_en||''):(vcur.pie||'');document.title=vcur.titulo+' · Triggui';
    var f=$('yt');var src='https://www.youtube-nocookie.com/embed/'+vcur.id+'?playsinline=1&rel=0&modestbranding=1&enablejsapi=1';if(f.getAttribute('src')!==src){{f.setAttribute('src',src);f.setAttribute('title',vcur.titulo);}}
    var d=$('dots');d.innerHTML='';V.forEach(function(x,i){{var b=document.createElement('button');b.className=i===vi?'on':'';b.setAttribute('aria-label',x.titulo);b.addEventListener('click',function(){{if(i===vi)return;vi=i;vcur=V[vi];visto=false;try{{localStorage.setItem('tg_rot_v_'+{_J(slug)},String(vi));}}catch(e){{}}pintaV();engancha();}});d.appendChild(b);}});}}
  var visto=false;
  var player=null;function engancha(){{try{{if(!window.YT||!YT.Player)return;player=new YT.Player('yt',{{events:{{onStateChange:function(e){{if(e.data===1&&!visto){{visto=true;$('hint').textContent='';try{{gtag('event','video_play',{{contexto:'video',slug:{_J(slug)},video:vcur.id,titulo:vcur.titulo,indice:vi}});}}catch(x){{}}}}}}}}}});}}catch(e){{}}}}
  window.onYouTubeIframeAPIReady=engancha;
  pintaV();
  var sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.async=true;document.head.appendChild(sc);
}})();
</script>
</body>
</html>"""
    d = Path(out_dir) / "video"
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(page, encoding="utf-8")
    return True
