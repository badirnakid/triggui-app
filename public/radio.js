/* 🎵 /radio.js — La radio de tu espiral (Hélice + Guardados). Un solo blob para dos rutas: paridad por construcción.
   Sutura entre cuartos: instantánea de la cola (arranca sin esperar el catálogo) + prefetch del otro cuarto +
   preload del preview + compensación del tiempo transcurrido. Consentimiento: jamás arranca sin un gesto previo. */
(function(){
  var pag = /\/mi\/?(\?|#|$)/.test(location.pathname + location.search) ? 'mi' : 'helice';
  var btn=document.getElementById('vinHelice'), bar=document.getElementById('vinBarra');
  if(!btn||!bar) return;
  var cov=bar.querySelector('.vhCov'), bbtn=bar.querySelector('.vhBtn'), tit=bar.querySelector('.vhTit'), art=bar.querySelector('.vhArt'),
      pie=bar.querySelector('.vhPie'), lnk=bar.querySelector('.vhLink'), bdg=lnk?lnk.querySelector('img'):null,
      ipP=bar.querySelector('.vhIcoPlay'), ipS=bar.querySelector('.vhIcoPause'), hP=btn.querySelector('.vhPlay'), hS=btn.querySelector('.vhPause');
  var KEY='triggui_radio_v1', KCOLA='triggui_radio_cola_v1', MANUAL='https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_manual.json';
  var franja=(function(h){return h<6?'noche':h<12?'manana':h<19?'tarde':'noche';})(new Date().getHours());
  var PREF={manana:['abrir','profundizar','aterrizar','resonar'],tarde:['profundizar','abrir','aterrizar','resonar'],noche:['resonar','aterrizar','profundizar','abrir']}[franja];
  var cola=[], i=0, au=new Audio(), fadeT=null, cierraT=null, fallos=0, played={}, pendiente=null, hoja=null;
  au.preload='auto';

  /* ── prefetch del otro cuarto: la navegación sale de caché ── */
  try{ var pf=document.createElement('link'); pf.rel='prefetch'; pf.href=(pag==='mi')?'/espiral/':'/mi/'; document.head.appendChild(pf); }catch(e){}

  function slugDe(b){ if(b&&b._slug) return b._slug; var s=String((b&&b.titulo)||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); return s; }
  function ordena(cs){ return cs.slice().sort(function(a,b){ var pa=PREF.indexOf(a.rol),pb=PREF.indexOf(b.rol); if(pa<0&&pb<0) return 0; if(pa<0) return 1; if(pb<0) return -1; if(pa!==pb) return pa-pb; return (b.armonia||0)-(a.armonia||0); }); }
  function arma(libros){
    var por=(libros||[]).filter(function(b){return b&&b._musica&&Array.isArray(b._musica.candidatos)&&b._musica.candidatos.length;})
      .sort(function(a,b){return (b._edicion_numero||0)-(a._edicion_numero||0);})
      .map(function(b){return {b:{titulo:b.titulo,titulo_en:b.titulo_en,_slug:b._slug,_edicion_numero:b._edicion_numero,_catalogo:b._catalogo},cs:ordena(b._musica.candidatos)};});
    var out=[], ronda=0, hay=true;
    while(hay&&ronda<9){ hay=false; for(var k=0;k<por.length;k++){ var c=por[k].cs[ronda]; if(c){ out.push({b:por[k].b,c:c}); hay=true; } } ronda++; }
    return out;
  }
  function cargar(){ return fetch(MANUAL,{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){ return (d.libros||[]).filter(function(b){return b&&b._edicion_numero&&b.titulo;}); }); }
  function snapshot(){ try{ var s=JSON.parse(sessionStorage.getItem(KCOLA)||'null'); if(s&&s.ts&&(Date.now()-s.ts)<15*60000&&Array.isArray(s.cola)&&s.cola.length) return s.cola; }catch(e){} return null; }
  function guardaCola(){ try{ sessionStorage.setItem(KCOLA, JSON.stringify({ts:Date.now(),cola:cola})); }catch(e){} }

  function tituloDe(b){ try{ if(window.pvTitulo) return window.pvTitulo(b)||b.titulo||''; }catch(e){} return (window.PV_LANG==='en'&&b.titulo_en)?b.titulo_en:(b.titulo||''); }
  function badgeLang(){ if(!bdg||!bdg.src) return; var l=(window.PV_LANG==='en')?'en-us':'es-mx'; if(bdg.src.indexOf('/'+l)<0) bdg.src='https://tools.applemediaservices.com/api/badges/listen-on-apple-music/badge/'+l; }
  function pinta(){ var p=cola[i]; if(!p) return; tit.textContent=p.c.cancion; art.textContent=p.c.artista+' \u00b7 \uD83D\uDCD8 '+tituloDe(p.b); if(pie) pie.textContent=p.c.pie||'';
    if(lnk&&p.c.link) lnk.href=p.c.link; if(cov&&p.c.art){cov.src=p.c.art;cov.alt=tituloDe(p.b);}
    bar.style.setProperty('--vh-p','0%'); btn.style.setProperty('--vh-p','0%'); badgeLang(); }
  function icon(p){ if(ipP)ipP.style.display=p?'none':'block'; if(ipS)ipS.style.display=p?'block':'none'; if(hP)hP.style.display=p?'none':'block'; if(hS)hS.style.display=p?'block':'none'; btn.classList.toggle('sonando',p); if(bbtn) bbtn.setAttribute('aria-label',p?((window.PV_LANG==='en')?'Pause':'Pausa'):((window.PV_LANG==='en')?'Play':'Reproducir')); }
  function abre(){ bar.classList.add('abierta'); btn.classList.add('morf'); reagenda(); }
  function cierra(){ bar.classList.remove('abierta'); btn.classList.remove('morf'); }
  function reagenda(){ clearTimeout(cierraT); cierraT=setTimeout(cierra,5000); }
  function apaga(){ if(fadeT){clearInterval(fadeT);fadeT=null;} try{au.pause();}catch(e){} icon(false); guarda(); }
  function sigue(){ if(fadeT){clearInterval(fadeT);fadeT=null;} au.volume=1; i=(i+1)%cola.length; pinta(); play(); }
  function despedida(){ if(fadeT) return; var v=au.volume; fadeT=setInterval(function(){ v-=0.09; if(v<=0){ sigue(); } else { try{au.volume=Math.max(0,v);}catch(e){} } },180); }
  au.addEventListener('timeupdate',function(){ var t=au.currentTime, pc=Math.min(100,(t/30)*100)+'%'; bar.style.setProperty('--vh-p',pc); btn.style.setProperty('--vh-p',pc); if(t>=28) despedida(); if(Math.floor(t*2)%4===0) guarda(); });
  au.addEventListener('ended',sigue);
  au.addEventListener('error',function(){ fallos++; if(fallos>=cola.length){ fallos=0; apaga(); } else { sigue(); } });
  function play(){ var p=cola[i]; if(!p) return; if(fadeT){clearInterval(fadeT);fadeT=null;} au.volume=1;
    if(au.src!==p.c.preview) au.src=p.c.preview;
    return au.play().then(function(){ icon(true); fallos=0; guarda();
      if(!played[p.c.id]){ played[p.c.id]=1; try{gtag('event','musica_play',{contexto:pag,slug:slugDe(p.b),cancion:p.c.cancion,artista:p.c.artista,franja:franja});}catch(e){} }
      try{ if('mediaSession' in navigator){ navigator.mediaSession.metadata=new MediaMetadata({title:p.c.cancion,artist:p.c.artista,album:tituloDe(p.b)||'Triggui',artwork:p.c.art?[{src:p.c.art,sizes:'600x600',type:'image/jpeg'}]:[]});
        navigator.mediaSession.setActionHandler('pause',function(){apaga();}); navigator.mediaSession.setActionHandler('play',function(){play();}); navigator.mediaSession.setActionHandler('nexttrack',function(){sigue();}); } }catch(e){}
    }).catch(function(){ icon(false); }); }

  /* ── continuidad: el estado viaja entre cuartos; reanuda en t + tiempo transcurrido ── */
  function guarda(){ try{ if(!cola.length||!cola[i]) return; sessionStorage.setItem(KEY, JSON.stringify({id:cola[i].c.id,t:au.currentTime||0,playing:!au.paused,ts:Date.now()})); }catch(e){} }
  window.addEventListener('pagehide',guarda); document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden') guarda(); });
  document.addEventListener('pointerdown',function(ev){ try{ var a=ev.target&&ev.target.closest&&ev.target.closest('a[href]'); if(a) guarda(); }catch(e){} },true);
  function reanuda(){ var st=null; try{ st=JSON.parse(sessionStorage.getItem(KEY)||'null'); }catch(e){}
    if(!st||!st.playing||(Date.now()-(st.ts||0))>180000) return false;
    var k=-1; for(var j=0;j<cola.length;j++){ if(cola[j].c.id===st.id){ k=j; break; } } if(k<0) return false;
    var t=(st.t||0)+Math.max(0,(Date.now()-(st.ts||Date.now()))/1000);
    i=k; if(t>=27.5){ i=(k+1)%cola.length; t=0; }               /* el tiempo siguió corriendo: si el bocado ya terminó, la radio ya está en el siguiente */
    pinta(); t=Math.max(0,Math.min(27,t));
    var seek=function(){ try{ au.currentTime=t; }catch(e){} };
    au.addEventListener('loadedmetadata',seek,{once:true});
    au.src=cola[i].c.preview; seek();
    au.play().then(function(){ icon(true); seek(); guarda(); }).catch(function(){ pendiente=t; btn.classList.add('reanudar'); btn.setAttribute('aria-label',(window.PV_LANG==='en')?'Resume the radio':'Reanudar la radio'); });
    return true; }

  btn.addEventListener('click',function(){
    if(pendiente!==null){ var t=pendiente; pendiente=null; btn.classList.remove('reanudar'); au.addEventListener('loadedmetadata',function(){try{au.currentTime=t;}catch(e){}},{once:true}); var pr=play(); try{au.currentTime=t;}catch(e){} abre(); return; }
    if(bar.classList.contains('abierta')){ reagenda(); return; }
    abre(); if(au.paused) play(); });
  if(bbtn) bbtn.addEventListener('click',function(ev){ ev.stopPropagation(); if(au.paused){ play(); } else { apaga(); } reagenda(); });
  var meta=bar.querySelector('.vhMeta'); if(meta) meta.addEventListener('click',function(){ var p=cola[i]; if(!p) return; var s=slugDe(p.b); if(s){ guarda(); try{gtag('event','musica_helice_libro',{slug:s});}catch(e){} location.href=(p.b._catalogo==='kids'?'/kids/t/':'/t/')+encodeURIComponent(s)+'/'; } });

  /* ── idioma: por html[lang] (ambas páginas lo declaran al cambiar) ── */
  function idioma(){ var en=(window.PV_LANG==='en');
    if(pag==='helice') btn.setAttribute('data-nombre', en?'Music':'M\u00fasica');
    btn.setAttribute('aria-label', en?'Listen to the radio of your spiral':'Escuchar la radio de tu espiral');
    bar.setAttribute('aria-label', en?'Radio of your spiral':'Radio de tu espiral'); if(lnk) lnk.setAttribute('aria-label','Apple Music');
    badgeLang(); if(cola.length) pinta(); }
  new MutationObserver(idioma).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  /* ── hélice: sintonía al abrir la hoja de un libro (solo si ya sonaba) + un solo sonido con el video ── */
  if(pag==='helice'){
    function sintoniza(){ if(!hoja||!hoja.classList.contains('ver')||au.paused) return;
      var sem=hoja.querySelector('.h-sem'); var m=sem&&/#\s*(\d+)/.exec(sem.textContent||''); if(!m) return;
      var n=parseInt(m[1],10), k=-1; for(var j=0;j<cola.length;j++){ if((cola[j].b._edicion_numero|0)===n){ k=j; break; } }
      if(k<0||k===i) return;
      var v=au.volume, t=setInterval(function(){ v-=0.15; if(v<=0){ clearInterval(t); i=k; pinta(); au.volume=1; play(); try{gtag('event','musica_helice_sintonia',{edicion:n});}catch(e){} } else { try{au.volume=Math.max(0,v);}catch(e){} } },90); }
    (function engancha(n){ hoja=document.getElementById('hoja');
      if(hoja){ new MutationObserver(function(){ setTimeout(sintoniza,120); }).observe(hoja,{attributes:true,attributeFilter:['class']}); return; }
      if(n<80) setTimeout(function(){engancha(n+1);},400); })(0);
    window.addEventListener('message',function(e){ try{ var d=(typeof e.data==='string')?e.data:''; if(d.indexOf('"playerState":1')>=0 && !au.paused){ apaga(); } }catch(x){} });
  }

  /* ── guardados: botón y barra sobre la casa (medido en vivo) + pill junto al saludo ── */
  if(pag==='mi'){
    function sobreCasa(){ try{ var c=document.getElementById('casa'); if(!c||getComputedStyle(c).display==='none') return; var r=c.getBoundingClientRect(); if(r.height<4) return;
      var b=Math.round(innerHeight-r.top)+14; btn.style.bottom=b+'px'; bar.style.bottom=b+'px'; }catch(e){} }
    sobreCasa(); window.addEventListener('resize',sobreCasa); setTimeout(sobreCasa,800); setTimeout(sobreCasa,2500);
    function pillJuntoAlSaludo(){ try{ var q=document.getElementById('quien'), p=document.getElementById('tgLangPill'); if(!q||!p) return;
      var rq=q.getBoundingClientRect(), rp=p.getBoundingClientRect(); if(rq.width<10||rp.width<10) return;
      var logo=document.querySelector('#barra .marca'); var izq=logo?logo.getBoundingClientRect().right:0;
      if(rq.left-izq >= rp.width+20){ p.style.top=Math.round(rq.top+(rq.height-rp.height)/2)+'px'; p.style.right=Math.round(innerWidth-rq.left+10)+'px'; }
      else { p.style.top=''; p.style.right=''; } }catch(e){} }
    [400,1200,2600].forEach(function(t){ setTimeout(pillJuntoAlSaludo,t); }); window.addEventListener('resize',pillJuntoAlSaludo);
    new MutationObserver(function(){ setTimeout(pillJuntoAlSaludo,80); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    var q0=document.getElementById('quien'); if(q0){ new MutationObserver(function(){ setTimeout(pillJuntoAlSaludo,50); }).observe(q0,{childList:true,characterData:true,subtree:true}); }
  }

  /* ── arranque: instantánea primero (sutura), catálogo después (reconciliación silenciosa) ── */
  var snap=snapshot(), montada=false;
  function monta(){ if(montada||!cola.length) return; montada=true; pinta(); idioma(); btn.classList.add('on'); reanuda(); }
  if(snap){ cola=snap; monta(); }
  cargar().then(function(libros){ var nueva=arma(libros); if(!nueva.length) return;
    var idAct=(cola[i]&&cola[i].c.id)||null; cola=nueva; var k=-1;
    if(idAct!==null){ for(var j=0;j<cola.length;j++){ if(cola[j].c.id===idAct){ k=j; break; } } }
    i=(k>=0)?k:0; guardaCola(); if(!montada) monta(); else pinta(); }).catch(function(){});
})();
