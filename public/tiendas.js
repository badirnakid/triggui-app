/* 🛒 Triggui · tiendas.js · v2 (14 de noviembre de 2026: B417 las tiendas; BC56 las marcas UTM)
 *
 * A qué tienda manda cada botón. Es la única regla, y la usan la app, las ediciones y la liga del correo (/ir/).
 *
 *   Cada liga a una tienda lleva su marca, para que el Analytics de la tienda vea que la visita y la venta vienen
 *   de Triggui (BC56):
 *     utm_source=triggui · utm_medium=referral (email si viene del correo) · utm_campaign=comprar|descubre|explorar
 *     (el botón: «Comprar», 🔮 y «Explorar») · utm_content=<el libro> (su slug, si lo trae) · utm_term=<el lugar>
 *     (app, ninos, edicion, edicion-ninos o correo).
 *   Las marcas que ya trajera una liga se cambian por estas (nunca se duplican). La misma marca, carácter por
 *   carácter, la ponen tienda_marca() de las ediciones (scripts/build-editions.py) y las ligas de respaldo de la
 *   app y de las ediciones cuando este archivo no llega.
 *
 *   En México (la zona horaria del teléfono es de México):
 *     · «Comprar» → Casa del Libro si tiene el libro físico con existencias; si no, Gandhi; si ninguna, la búsqueda
 *       de Gandhi por título. Lo dice el campo «tienda_compra» de cada libro, que el horno revisa.
 *     · 🔮 → busca la palabra del momento en Casa del Libro.
 *     · «Explorar» → busca la palabra en Gandhi.
 *   Fuera de México:
 *     · «Comprar» → Amazon del país del lector (amazon.com donde no hay uno propio), en la sección de libros.
 *       La edición sale del idioma de la página: en inglés, el título en inglés; en español, el título en español.
 *     · 🔮 → busca la palabra en ese mismo Amazon.
 *     · «Explorar en Gandhi» no se muestra.
 *
 * Solo arma ligas a casadelibro.com.mx, www.gandhi.com.mx y Amazon: una liga de los datos que apunte a otro
 * lado no se usa (así /ir/ nunca redirige a un sitio ajeno).
 */
(function (w) {
  'use strict';

  var ZONAS_MEXICO = {
    'America/Mexico_City': 1, 'America/Cancun': 1, 'America/Merida': 1, 'America/Monterrey': 1, 'America/Matamoros': 1,
    'America/Chihuahua': 1, 'America/Ciudad_Juarez': 1, 'America/Ojinaga': 1, 'America/Mazatlan': 1,
    'America/Bahia_Banderas': 1, 'America/Hermosillo': 1, 'America/Tijuana': 1, 'America/Ensenada': 1,
    'America/Santa_Isabel': 1, 'Mexico/General': 1, 'Mexico/BajaNorte': 1, 'Mexico/BajaSur': 1
  };

  // Identificadores de Afiliados de Amazon por dominio (van visibles en la liga; no son secretos).
  // Vacío mientras Badir no los dé: las ligas salen sin comisión.
  var ETIQUETAS_AMAZON = {};

  function zonaHoraria() {
    try { return (Intl.DateTimeFormat().resolvedOptions().timeZone || '') + ''; } catch (e) { return ''; }
  }

  function enMexico() {
    var z = zonaHoraria();
    if (z) return ZONAS_MEXICO.hasOwnProperty(z);
    // Sin zona horaria (navegadores muy viejos): el idioma del teléfono.
    var l = '';
    try { l = (navigator.languages && navigator.languages.join(',')) || navigator.language || ''; } catch (e) {}
    return /(^|,)\s*[a-z]{2}-MX\b/i.test(l);
  }

  function amazonDominio(z) {
    z = z == null ? zonaHoraria() : z;
    if (/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(z)) return 'amazon.es';
    if (/^Europe\/(London|Dublin|Belfast|Guernsey|Isle_of_Man|Jersey)$/.test(z)) return 'amazon.co.uk';
    if (/^Europe\/(Berlin|Vienna|Zurich|Busingen|Vaduz)$/.test(z)) return 'amazon.de';
    if (/^Europe\/(Paris|Monaco|Luxembourg)$/.test(z)) return 'amazon.fr';
    if (/^Europe\/Brussels$/.test(z)) return 'amazon.com.be';
    if (/^Europe\/(Rome|Vatican|San_Marino)$/.test(z)) return 'amazon.it';
    if (/^Europe\/Amsterdam$/.test(z)) return 'amazon.nl';
    if (/^Europe\/Stockholm$/.test(z)) return 'amazon.se';
    if (/^Europe\/Warsaw$/.test(z)) return 'amazon.pl';
    if (/^(Europe|Asia)\/Istanbul$/.test(z)) return 'amazon.com.tr';
    if (/^Brazil\//.test(z) || /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Araguaina|Maceio|Santarem|Noronha|Eirunepe)$/.test(z)) return 'amazon.com.br';
    if (/^Canada\//.test(z) || /^America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Dawson|Dawson_Creek|Fort_Nelson|Cambridge_Bay|Iqaluit|Rankin_Inlet|Resolute|Swift_Current|Atikokan|Creston|Inuvik|Yellowknife|Nipigon|Thunder_Bay|Rainy_River|Pangnirtung|Blanc-Sablon)$/.test(z)) return 'amazon.ca';
    if (/^Australia\//.test(z)) return 'amazon.com.au';
    if (/^(Asia\/Tokyo|Japan)$/.test(z)) return 'amazon.co.jp';
    if (/^Asia\/(Kolkata|Calcutta)$/.test(z)) return 'amazon.in';
    if (/^(Asia\/Singapore|Singapore)$/.test(z)) return 'amazon.sg';
    if (/^Asia\/Dubai$/.test(z)) return 'amazon.ae';
    if (/^Asia\/Riyadh$/.test(z)) return 'amazon.sa';
    return 'amazon.com';
  }

  // Un carácter partido (medio par sustituto) haría fallar encodeURIComponent: se cambia por «�», como hace Python.
  function bienFormado(s) {
    if (!/[\uD800-\uDFFF]/.test(s)) return s;
    var r = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) {
        var d = s.charCodeAt(i + 1);
        if (d >= 0xDC00 && d <= 0xDFFF) { r += s.charAt(i) + s.charAt(i + 1); i++; } else { r += '\uFFFD'; }
      } else if (c >= 0xDC00 && c <= 0xDFFF) {
        r += '\uFFFD';
      } else {
        r += s.charAt(i);
      }
    }
    return r;
  }
  function enc(s) { return encodeURIComponent(bienFormado(String(s == null ? '' : s)).replace(/\s+/g, ' ').trim()); }

  // El título sin subtítulo. Es la misma regla, carácter por carácter, que tituloCorto() del horno
  // (experiments/nucleus/tiendas.mjs) y que tienda_titulo_corto() de las ediciones (scripts/build-editions.py).
  function esLetra(c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || (c >= '\u00C0' && c <= '\u00FF');
  }

  function tituloCorto(t) {
    var s = String(t == null ? '' : t);
    // El separador sin «\s*» delante y luego hacia atrás sobre los espacios: el mismo corte, en tiempo lineal.
    var corte = s.search(/:|\s[-–—]\s|\(|\[|\|/);
    while (corte > 0 && /\s/.test(s.charAt(corte - 1))) corte--;
    // Una palabra de 4 letras o más seguida de «. », si está antes del separador.
    for (var i = s.indexOf('.'); i !== -1; i = s.indexOf('.', i + 1)) {
      if (!/\s/.test(s.charAt(i + 1))) continue;
      var j = i;
      while (j > 0 && esLetra(s.charAt(j - 1))) j--;
      if (i - j >= 4 && (corte < 0 || i < corte)) { corte = i; break; }
    }
    return (corte > 0 ? s.slice(0, corte) : s).trim();
  }

  function amazon(q) {
    var dom = amazonDominio();
    var tag = ETIQUETAS_AMAZON[dom];
    return 'https://www.' + dom + '/s?k=' + enc(q) + '&i=stripbooks' + (tag ? '&tag=' + encodeURIComponent(tag) : '');
  }

  function casaDelLibro(q) { return 'https://casadelibro.com.mx/search/?q=' + enc(q); }
  function gandhi(q) { return 'https://www.gandhi.com.mx/?query=' + enc(q); }

  var DOMINIO_DE = { casadelibro: /^https:\/\/casadelibro\.com\.mx\//, gandhi: /^https:\/\/www\.gandhi\.com\.mx\// };

  // 🏷️ BC56 · Las marcas UTM. Los lugares que se conocen; con otro (o sin ninguno), el de la página.
  var LUGARES = { 'app': 1, 'ninos': 1, 'edicion': 1, 'edicion-ninos': 1, 'correo': 1 };

  function lugarDeLaPagina() {
    var p = '';
    try { p = String((w.location && w.location.pathname) || ''); } catch (e) {}
    if (/^\/kids\/t\//.test(p)) return 'edicion-ninos';
    if (/^\/t\//.test(p)) return 'edicion';
    if (/^\/kids(\/|$)/.test(p)) return 'ninos';
    if (/^\/ir(\/|$)/.test(p)) return 'correo';
    return 'app';
  }

  // La liga con sus marcas: las utm_ que ya trajera se quitan y van las de Triggui, siempre en el mismo orden.
  function marcar(url, boton, contenido, lugar) {
    var u = String(url == null ? '' : url);
    if (!/^https:\/\//.test(u)) return u;
    if (!LUGARES.hasOwnProperty(lugar)) lugar = lugarDeLaPagina();
    var resto = '';
    var g = u.indexOf('#');
    if (g >= 0) { resto = u.slice(g); u = u.slice(0, g); }
    var q = u.indexOf('?');
    var base = q >= 0 ? u.slice(0, q) : u;
    var partes = q >= 0 ? u.slice(q + 1).split('&') : [];
    var quedan = [];
    for (var i = 0; i < partes.length; i++) {
      if (partes[i] && !/^[uU][tT][mM]_/.test(partes[i])) quedan.push(partes[i]);
    }
    quedan.push('utm_source=triggui');
    quedan.push('utm_medium=' + (lugar === 'correo' ? 'email' : 'referral'));
    quedan.push('utm_campaign=' + enc(boton));
    var c = enc(contenido);
    if (c) quedan.push('utm_content=' + c);
    quedan.push('utm_term=' + lugar);
    return base + '?' + quedan.join('&') + resto;
  }

  // { url, tienda } del botón «Comprar». idioma: 'es' o 'en' (el de la página). lugar: dónde está el botón.
  // contenido: el libro en la marca (si no se da, su slug).
  function comprar(libro, idioma, mexico, lugar, contenido) {
    libro = libro || {};
    if (mexico == null) mexico = enMexico();
    if (contenido == null) contenido = libro._slug || '';
    var r;
    if (mexico) {
      var tc = libro.tienda_compra;
      if (tc && Object.prototype.hasOwnProperty.call(DOMINIO_DE, tc.tienda) && DOMINIO_DE[tc.tienda].test(String(tc.url || ''))) {
        r = { url: String(tc.url), tienda: tc.tienda };
      } else {
        r = { url: gandhi(tituloCorto(libro.titulo)), tienda: 'gandhi' };
      }
    } else {
      var titulo = (idioma === 'en' && libro.titulo_en) ? libro.titulo_en : libro.titulo;
      r = { url: amazon(tituloCorto(titulo) + ' ' + (libro.autor || '')), tienda: 'amazon' };
    }
    r.url = marcar(r.url, 'comprar', contenido, lugar);
    return r;
  }

  // { url, tienda } del 🔮: la palabra del momento.
  function explorar(palabra, mexico, lugar, contenido) {
    if (mexico == null) mexico = enMexico();
    var r = mexico ? { url: casaDelLibro(palabra), tienda: 'casadelibro' } : { url: amazon(palabra), tienda: 'amazon' };
    r.url = marcar(r.url, 'descubre', contenido, lugar);
    return r;
  }

  // { url, tienda } de «Explorar en Gandhi», o null fuera de México (el botón no se muestra).
  function explorarGandhi(palabra, mexico, lugar, contenido) {
    if (mexico == null) mexico = enMexico();
    return mexico ? { url: marcar(gandhi(palabra), 'explorar', contenido, lugar), tienda: 'gandhi' } : null;
  }

  w.TrigguiTiendas = {
    version: 2,
    enMexico: enMexico,
    zonaHoraria: zonaHoraria,
    amazonDominio: amazonDominio,
    tituloCorto: tituloCorto,
    marcar: marcar,
    lugarDeLaPagina: lugarDeLaPagina,
    comprar: comprar,
    explorar: explorar,
    explorarGandhi: explorarGandhi,
    logo: { casadelibro: '/tiendas/casadellibro-blanco.png', gandhi: '/tiendas/gandhi-blanco.png' }
  };

  // La app y las ediciones cargan este archivo sin detener la página («async»). Al llegar, avisa: las ediciones
  // rehacen entonces sus ligas con la regla completa (la app lo lee al abrir cada tarjeta).
  try { w.dispatchEvent(new Event('trigguitiendas')); } catch (e) {}
})(window);
