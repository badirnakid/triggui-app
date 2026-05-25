import { StatusBar } from 'expo-status-bar';
import { Platform, BackHandler, View, Animated, StyleSheet, Easing, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGUI — DIVINE SIGNATURE SPLASH (final)
//
// Pantalla negra absoluta. Cero halo. Cero ruido.
//
// 20 paletas dopaminérgicas curadas — cada apertura elige una aleatoria.
// Línea horizontal + subrayado pispireto comparten paleta.
//
// Transición al WebView nivel dios (Plan A — fade orquestado matemático):
//   - Logo del splash: micro-shrink 1.00 → 0.96 + fade out (300ms)
//   - Subrayado: fade out simultáneo (300ms)
//   - WebView: aparece bajo el overlay (sin transform — bug Android conocido)
//   - Fondo negro persiste — cero flash
//
// ═══════════════════════════════════════════════════════════════════════════════
// CAMBIOS NIVEL DIOS (UX divina Android — mayo 2026):
//   1. react-native-safe-area-context con insets REACTIVOS → el WebView se ancla
//      siempre al área visible real. Sobrevive resume del multitarea, rotación y
//      el toggle de barras del sistema (raíz del bug "crece vertical" bajo el
//      edge-to-edge forzado de SDK 54). Determinístico, se auto-corrige.
//   2. useWindowDimensions (reactivo) en vez de Dimensions.get (estático) → la
//      geometría del splash responde a la orientación.
//   3. Botón "Atrás" visual ELIMINADO. El back nativo de Android queda (BackHandler
//      → webview.goBack). En iOS, swipe-back nativo (allowsBackForwardNavigationGestures).
//   4. Zoom explícito (accesibilidad): setBuiltInZoomControls + scalesPageToFit.
//   5. cacheMode LOAD_DEFAULT (antes LOAD_CACHE_ELSE_NETWORK) → respeta headers HTTP;
//      los cambios del web propagan sin republicar la app.
//   6. Canvas del WebView por dominio (webBg): negro para Triggui (cero flash),
//      blanco para sitios externos. Sin esto, el negro del WebView se asomaba bajo
//      el <body> sin fondo opaco de sitios como Buscalibre y volvía ilegible su
//      texto. Principio anti-parpadeo "light leads, dark trails": a claro se cambia
//      en onLoadStart (antes de pintar), a oscuro en onLoadEnd (ya pintado) → la
//      página saliente nunca bleedea. Replica el render de Chrome. Cross-platform.
// ═══════════════════════════════════════════════════════════════════════════════

SplashScreen.preventAutoHideAsync().catch(() => {});

// Easings
const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SWEEP_EASE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT_EASE = Easing.bezier(0.33, 1, 0.68, 1);

// ═══════════════════════════════════════════════════════════════════════════════
// 20 PALETAS DOPAMINÉRGICAS CURADAS
//
// Cada paleta tiene 4 colores que funcionan armoniosamente sobre fondo negro.
// Probadas en arte digital — combinaciones de alta vibración cromática.
// Estructura: [color1, color2, color3, color4] — los 4 puntos del gradiente.
// ═══════════════════════════════════════════════════════════════════════════════
const PALETTES = [
  // 1. Aurora Original — la firma
  ['#30FFE4', '#FF0080', '#FF8C00', '#FFD700'],
  // 2. Sunset Spark
  ['#FF0080', '#FF4500', '#FF8C00', '#FFC107'],
  // 3. Deep Space
  ['#1E90FF', '#7B68EE', '#FF00FF', '#FF1493'],
  // 4. Neon Lime
  ['#00FF94', '#30FFE4', '#00BFFF', '#FFD700'],
  // 5. Fire Trail
  ['#FF1744', '#FF6D00', '#FFAB00', '#FFEA00'],
  // 6. Pacific Mist
  ['#00E5FF', '#1DE9B6', '#76FF03', '#C6FF00'],
  // 7. Cosmic Berry
  ['#9C27B0', '#E91E63', '#FF1744', '#FF6E40'],
  // 8. Golden Hour
  ['#FFB300', '#FFD700', '#FF8C00', '#FF5722'],
  // 9. Electric Mint
  ['#1DE9B6', '#00E5FF', '#40C4FF', '#B388FF'],
  // 10. Royal Aurora
  ['#673AB7', '#3F51B5', '#E040FB', '#FFD600'],
  // 11. Tropical Punch
  ['#FF1744', '#FF4081', '#FF6E40', '#FFAB40'],
  // 12. Ocean Pulse
  ['#18FFFF', '#40C4FF', '#7C4DFF', '#E040FB'],
  // 13. Solar Flare
  ['#FF3D00', '#FF9100', '#FFC400', '#FFEA00'],
  // 14. Jade Spark
  ['#00E676', '#1DE9B6', '#00BFA5', '#64FFDA'],
  // 15. Magenta Dream
  ['#D500F9', '#FF00FF', '#FF1493', '#FF6EC7'],
  // 16. Arctic Glow
  ['#80DEEA', '#26C6DA', '#00ACC1', '#26A69A'],
  // 17. Lava Rose
  ['#FF1744', '#F50057', '#D500F9', '#651FFF'],
  // 18. Honey Drift
  ['#FFD600', '#FFAB00', '#FF6F00', '#E65100'],
  // 19. Cyber Grape
  ['#651FFF', '#7C4DFF', '#E040FB', '#FF4081'],
  // 20. Rainbow Spark
  ['#FF0080', '#FFD700', '#00FF94', '#00BFFF'],
];

// Selección aleatoria al montar el componente
function pickRandomPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// App = solo el provider de safe-area. Toda la lógica vive en AppInner para que
// useSafeAreaInsets tenga el provider por encima (requisito de la librería).
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  // Insets REACTIVOS — se recalculan en resume del multitarea, rotación y toggle
  // de barras. Esta es la salvaguarda matemática contra el desbordamiento vertical.
  const insets = useSafeAreaInsets();

  // Dimensiones REACTIVAS — responden a la orientación.
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);

  // Paleta de esta sesión (se elige UNA vez al montar, no cambia durante runtime)
  const palette = useMemo(() => pickRandomPalette(), []);

  // ── Geometría del splash (derivada de las dimensiones reactivas) ──────────────
  const LOGO_WIDTH = Math.min(SCREEN_WIDTH * 0.32, 180);
  const LOGO_HEIGHT = LOGO_WIDTH * (160 / 500);
  const UNDERLINE_WIDTH = LOGO_WIDTH * 0.80;
  const LINE_WIDTH = SCREEN_WIDTH * 1.4;

  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [exitTriggered, setExitTriggered] = useState(false);
  const [showSplashContent, setShowSplashContent] = useState(true);

  // Fondo (canvas) del WebView por dominio. Triggui = negro (cero flash, es dark
  // por su CSS propio). Externos (Buscalibre, etc.) = blanco, porque muchos sitios
  // NO pintan un fondo opaco en su <body> y confían en el blanco por defecto del
  // navegador; si el canvas del WebView es negro, ese negro se asoma por debajo y
  // el texto del sitio (diseñado para fondo claro) queda ilegible. Igualar el
  // canvas a blanco para externos replica exactamente el render de Chrome.
  const [webBg, setWebBg] = useState('#000000');

  // ═══════════════════════════════════════════════════════════════════════════
  // VALORES ANIMADOS
  // ═══════════════════════════════════════════════════════════════════════════

  // Línea aurora
  const lineX = useRef(new Animated.Value(-LINE_WIDTH)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;

  // Logo (closeup desde 1.4 + rebotín)
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.4)).current;

  // Subrayado pispireto
  const underlineOpacity = useRef(new Animated.Value(0)).current;
  const underlineScaleX = useRef(new Animated.Value(0)).current;

  // Splash: opacity (controla todo el splash overlay)
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECUENCIA DEL SPLASH
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const runAnimation = async () => {
      SplashScreen.hideAsync().catch(() => {});

      // FASE 1 (0-800ms): Línea aurora barre
      Animated.parallel([
        Animated.timing(lineX, {
          toValue: SCREEN_WIDTH,
          duration: 800,
          easing: SWEEP_EASE,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(lineOpacity, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(560),
          Animated.timing(lineOpacity, {
            toValue: 0,
            duration: 120,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // FASE 2 (600ms): Logo entra closeup (1.4 → 1.0)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          delay: 600,
          easing: APPLE_EASE,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          delay: 600,
          easing: APPLE_EASE,
          useNativeDriver: true,
        }),
      ]).start();

      // FASE 3 (1200ms): Rebotín simpático
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.06,
            duration: 220,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1.00,
            duration: 220,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]).start();
      }, 1200);

      // FASE 4 (1400ms): Subrayado pispireto
      Animated.parallel([
        Animated.timing(underlineOpacity, {
          toValue: 0.95,
          duration: 600,
          delay: 1400,
          easing: APPLE_EASE,
          useNativeDriver: true,
        }),
        Animated.timing(underlineScaleX, {
          toValue: 1,
          duration: 600,
          delay: 1400,
          easing: APPLE_EASE,
          useNativeDriver: true,
        }),
      ]).start();

      // FASE 5 (2000ms): Listo para transición
      setTimeout(() => {
        setAnimationFinished(true);
      }, 2000);
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSICIÓN ORQUESTADA AL WEBVIEW (Plan A — nivel dios)
  //
  // Solo dispara cuando AMBOS:
  //   - animationFinished = true (splash completó secuencia)
  //   - webViewReady = true (FIRST_PAINT confirmado)
  //
  // Esto garantiza CERO flash, CERO pantalla intermedia, CERO brincos.
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);

      Animated.parallel([
        // Splash desaparece (suave, 600ms)
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 600,
          easing: EXIT_EASE,
          useNativeDriver: true,
        }),
        // Logo del splash hace micro-shrink mientras se va (sensación de "se asienta")
        Animated.timing(logoScale, {
          toValue: 0.96,
          duration: 600,
          easing: EXIT_EASE,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSplashContent(false);
      });
    }
  }, [animationFinished, webViewReady, exitTriggered, logoScale, splashOpacity]);

  // Fallback de seguridad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!exitTriggered) {
        setWebViewReady(true);
        setAnimationFinished(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [exitTriggered]);

  const handleMessage = useCallback((event) => {
    if (event.nativeEvent.data === 'FIRST_PAINT') setWebViewReady(true);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CANVAS DEL WEBVIEW — PRINCIPIO ANTI-PARPADEO ("light leads, dark trails")
  //
  // El canvas (#000/#fff) se asoma SOLO donde la página visible no pinta fondo
  // opaco. Regla para que la página SALIENTE nunca herede un canvas más oscuro
  // que el suyo (lo que causaría un bleed momentáneo):
  //   • Transición HACIA CLARO (externo) → pinta blanco YA, en onLoadStart, antes
  //     de pintar. Triggui (dark, body opaco) tapa ese blanco mientras transiciona
  //     → cero flash en la salida.
  //   • Transición HACIA OSCURO (Triggui) → pinta negro SOLO en onLoadEnd, cuando
  //     Triggui ya pintó su body opaco. El flip es invisible y el sitio externo
  //     saliente conserva su canvas blanco hasta el final → no bleedea oscuro.
  // Las navegaciones cruzadas (Triggui⇄externo) son cargas completas → onLoadStart
  // y onLoadEnd disparan siempre. Las SPA quedan dentro de un mismo dominio, donde
  // el canvas ya es el correcto.
  // ═══════════════════════════════════════════════════════════════════════════
  const handleLoadStart = useCallback((e) => {
    const url = e.nativeEvent && e.nativeEvent.url;
    // Hacia un externo (claro): blanco adelante.
    if (url && url.indexOf('triggui.com') === -1) setWebBg('#ffffff');
  }, []);

  const handleLoadEnd = useCallback((e) => {
    const url = e.nativeEvent && e.nativeEvent.url;
    // De vuelta en Triggui (oscuro): negro atrás, solo cuando ya pintó.
    if (url && url.indexOf('triggui.com') !== -1) setWebBg('#000000');
  }, []);

  const handleNavigationStateChange = useCallback((navState) => {
    const isHome = navState.url === uri || navState.url === uri + '/';
    setCanGoBack(!isHome && navState.canGoBack);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // BACK NATIVO DE ANDROID
  // El botón/gesto físico de Android navega el historial del WebView. Si está en
  // home, devuelve false → comportamiento por defecto (salir). Sin botón visual.
  // En iOS, el swipe-back lo da allowsBackForwardNavigationGestures en el WebView.
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [canGoBack]);

  const injectedJS = `
    (function() {
      var css = \`
        * { -webkit-tap-highlight-color: transparent !important; -webkit-touch-callout: none !important; user-select: none; -webkit-user-select: none; }
        *:focus { outline: none !important; }
        input, textarea { user-select: text; -webkit-user-select: text; }
      \`;
      var style = document.createElement('style');
      style.innerHTML = css;
      document.head.appendChild(style);
      if (window.ReactNativeWebView) { requestAnimationFrame(function() { window.ReactNativeWebView.postMessage("FIRST_PAINT"); }); }
    })();
    true;
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  // COLOR-SCHEME LIGHT POR DOMINIO (medida defensiva en sitios externos)
  //
  // NOTA: la causa real del "Buscalibre oscuro" NO era prefers-color-scheme — era
  // el canvas negro del WebView asomándose bajo el <body> sin fondo opaco de
  // Buscalibre (resuelto con webBg blanco para externos, arriba). Este meta es una
  // salvaguarda adicional: declara que las páginas externas son light, evitando que
  // el WebView aplique oscurecimiento algorítmico a sitios sin tema propio. Se
  // inyecta SOLO en páginas que NO son triggui.com; Triggui (dark por su CSS) queda
  // intacto. Corre antes de pintar contenido. Quirúrgico, por dominio, cross-platform.
  // ═══════════════════════════════════════════════════════════════════════════
  const injectedBeforeLoad = `
    (function() {
      try {
        if (location.hostname.indexOf('triggui.com') === -1) {
          var m = document.createElement('meta');
          m.setAttribute('name', 'color-scheme');
          m.setAttribute('content', 'light');
          (document.head || document.documentElement).appendChild(m);
        }
      } catch (e) {}
    })();
    true;
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  // Construcción de gradientes con la paleta seleccionada
  //
  // FIX Android: los colores hex con alpha como sufijo (#RRGGBB + 'F2') NO son
  // soportados por expo-linear-gradient en Android. iOS los aceptaba.
  // El formato cross-platform seguro es rgba(r, g, b, a).
  // ═══════════════════════════════════════════════════════════════════════════
  const hexToRgba = (hex, alpha) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Gradiente de la línea aurora (8 stops con feathering)
  const lineGradientColors = [
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0)',
    hexToRgba(palette[0], 0.95),
    hexToRgba(palette[1], 1.0),
    hexToRgba(palette[2], 1.0),
    hexToRgba(palette[3], 0.95),
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0)',
  ];

  // Gradiente del subrayado pispireto (5 stops)
  const underlineGradientColors = [
    'rgba(0, 0, 0, 0)',
    hexToRgba(palette[0], 0.85),
    hexToRgba(palette[1], 1.0),
    hexToRgba(palette[3], 0.85),
    'rgba(0, 0, 0, 0)',
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  //
  // Estructura de capas (de atrás hacia adelante):
  //   1. container negro (flex:1) — base persistente, nunca desaparece (cero flash)
  //   2. webviewArea (flex:1) padeado por insets reactivos → WebView SIEMPRE en el
  //      área visible real, pase lo que pase con las barras del sistema
  //   3. Splash overlay (absoluteFill, full-screen) — se desvanece al final
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* CAPA 2: WebView anclado al área visible por insets reactivos.
          paddingTop = barra de estado, paddingBottom = barra de navegación.
          Si Android recompone alturas al volver del multitarea o al rotar, los
          insets cambian y el WebView se reajusta solo. El contenido web (100vh/dvh)
          nunca se desborda detrás de las barras. */}
      <View
        style={[
          styles.webviewArea,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <WebView
          ref={webViewRef}
          source={{ uri }}
          style={[styles.webview, { backgroundColor: webBg }]}
          containerStyle={[styles.webviewContainer, { backgroundColor: webBg }]}
          androidLayerType="hardware"
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          overScrollMode="never"
          allowsBackForwardNavigationGestures={true}
          decelerationRate={0.998}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          scalesPageToFit={true}
          setBuiltInZoomControls={true}
          setDisplayZoomControls={false}
          onMessage={handleMessage}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScript={injectedJS}
          injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOTÓN DE REGRESO — SOLO iOS (Platform.OS === 'ios')
          iOS no tiene barra de navegación nativa como Android, así que el back
          visible vive aquí. Android NO lo renderiza (queda con su barra/gesto
          nativo). Solo aparece cuando canGoBack === true (o sea, fuera de Triggui:
          en Buscalibre/Penguin/externos); en el home de Triggui no se ve nada.
          Diseño: círculo translúcido oscuro (contraste sobre cualquier fondo —
          Buscalibre blanco u otro), arriba-izquierda dentro de la safe area
          (respeta notch/Dynamic Island vía insets.top). El gesto de borde nativo
          (allowsBackForwardNavigationGestures) sigue activo como respaldo.
          Va fuera del webviewArea (flota encima del WebView) y antes del splash
          (el splash lo tapa durante el arranque). */}
      {Platform.OS === 'ios' && canGoBack && (
        <TouchableOpacity
          onPress={() => {
            if (webViewRef.current) webViewRef.current.goBack();
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Regresar a Triggui"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.iosBackButton, { top: insets.top + 8 }]}
        >
          <Text style={styles.iosBackChevron} accessible={false}>‹</Text>
        </TouchableOpacity>
      )}

      {/* CAPA 3: SPLASH OVERLAY — full-screen (cubre también las áreas de las barras) */}
      {showSplashContent && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { opacity: splashOpacity },
          ]}
        >
          {/* Línea aurora dopaminérgica (paleta aleatoria) — centrada vertical
              con la altura REACTIVA, así rota bien. */}
          <Animated.View
            style={[
              styles.lineContainer,
              {
                top: SCREEN_HEIGHT / 2 - 1.25,
                width: LINE_WIDTH,
                opacity: lineOpacity,
                transform: [{ translateX: lineX }],
              },
            ]}
          >
            <LinearGradient
              colors={lineGradientColors}
              locations={[0, 0.10, 0.25, 0.45, 0.60, 0.75, 0.90, 1.0]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.lineGradient}
            />
          </Animated.View>

          {/* Logo + subrayado, centrados */}
          <View style={styles.centerContainer} pointerEvents="none">
            <Animated.Image
              source={require('./assets/logo_text.png')}
              style={[
                {
                  width: LOGO_WIDTH,
                  height: LOGO_HEIGHT,
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
              resizeMode="contain"
              fadeDuration={0}
            />

            {/* Subrayado pispireto (paleta aleatoria) */}
            <Animated.View
              style={[
                styles.underlineWrap,
                {
                  width: UNDERLINE_WIDTH,
                  opacity: underlineOpacity,
                  transform: [{ scaleX: underlineScaleX }],
                },
              ]}
            >
              <LinearGradient
                colors={underlineGradientColors}
                locations={[0, 0.20, 0.50, 0.80, 1.0]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.underlineFill}
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Base negra persistente — flex:1, llena toda la pantalla (incl. detrás de barras).
  container: { flex: 1, backgroundColor: '#000000' },

  // Área del WebView — flex:1 dentro del container; el padding de insets la encoge
  // al área visible real. Fondo negro detrás de las barras (look de barras negras).
  webviewArea: { flex: 1, backgroundColor: '#000000' },

  webview: { flex: 1, backgroundColor: '#000000' },
  webviewContainer: { backgroundColor: '#000000' },

  // Botón de regreso flotante — SOLO iOS. Círculo translúcido oscuro arriba-izq.
  // El 'top' se setea inline con insets.top (safe area / notch). zIndex < splash
  // (999) para que el splash lo tape al arrancar; > WebView para flotar encima.
  iosBackButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  },
  iosBackChevron: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 30,
    marginLeft: -2,
    marginTop: -2,
    fontWeight: '300',
  },

  overlay: {
    backgroundColor: '#000000',
    zIndex: 999,
    overflow: 'hidden',
  },

  // Línea aurora — barra horizontal. El 'top' se calcula inline con la altura
  // reactiva (no aquí) para que rote correctamente.
  lineContainer: {
    position: 'absolute',
    left: 0,
    height: 2.5,
    zIndex: 5,
  },
  lineGradient: {
    flex: 1,
  },

  // Logo + subrayado centrados
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  underlineWrap: {
    height: 1.5,
    marginTop: 16,
    overflow: 'hidden',
  },
  underlineFill: {
    flex: 1,
  },
});