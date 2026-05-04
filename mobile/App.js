import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
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
//   - WebView: escala 1.04 → 1.00 + fade in (450ms, Apple ease)
//   - Fondo negro persiste — cero flash
//
// Timeline (1.8 segundos):
//   0ms      → Pantalla negra
//   0-800ms  → Línea aurora barre
//   600ms    → Logo entra closeup (scale 1.4 → 1.0)
//   1200ms   → Rebotín simpático (1.0 → 1.06 → 1.0)
//   1400ms   → Subrayado pispireto se extiende
//   2000ms   → Listo para fade orquestado al webview
// ═══════════════════════════════════════════════════════════════════════════════

SplashScreen.preventAutoHideAsync().catch(() => {});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Logo pequeño y discreto
const LOGO_WIDTH = Math.min(SCREEN_WIDTH * 0.32, 180);
const LOGO_HEIGHT = LOGO_WIDTH * (160 / 500);

// Subrayado pispireto
const UNDERLINE_WIDTH = LOGO_WIDTH * 0.80;

// Línea aurora
const LINE_WIDTH = SCREEN_WIDTH * 1.4;

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

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);

  // Paleta de esta sesión (se elige UNA vez al montar, no cambia durante runtime)
  const palette = useMemo(() => pickRandomPalette(), []);

  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [exitTriggered, setExitTriggered] = useState(false);
  const [showSplashContent, setShowSplashContent] = useState(true);

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

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSICIÓN PLAN A — fade orquestado matemático
  // ═══════════════════════════════════════════════════════════════════════════

  // Splash: opacity (controla todo el splash overlay)
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // El WebView NO tiene animación propia en Android (causa crash).
  // La transición se logra solo con el splash overlay haciendo fade out.

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

      // CAPA 1: Splash overlay fade out (logo + subrayado se atenúan)
      // CAPA 2: WebView fade in
      // (Sin transform:scale en WebView — bug conocido en Android)
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
  }, [animationFinished, webViewReady, exitTriggered]);

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

  const handleNavigationStateChange = useCallback((navState) => {
    const isHome = navState.url === uri || navState.url === uri + '/';
    setCanGoBack(!isHome && navState.canGoBack);
  }, []);

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
  // RENDER
  //
  // Estructura de capas (de atrás hacia adelante):
  //   1. Black background (siempre, never disappears)
  //   2. WebView (con escala + opacity animadas — entra "desde adentro")
  //   3. Splash overlay (con opacity animada — se desvanece al final)
  //
  // Notar: el WebView siempre está ahí, solo se hace visible al final.
  // El fondo negro detrás del WebView garantiza CERO flash.
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // Construcción de gradientes con la paleta seleccionada
  //
  // FIX Android: los colores hex con alpha como sufijo (#RRGGBB + 'F2') NO son
  // soportados por expo-linear-gradient en Android. iOS los aceptaba.
  // El formato cross-platform seguro es rgba(r, g, b, a).
  // Helper hexToRgba convierte de '#RRGGBB' + alpha 0..1 a 'rgba(r, g, b, a)'.
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />

      {/* CAPA 1: Fondo negro persistente — nunca desaparece, garantiza cero flash */}
      <View style={styles.blackBackground} />

      {/* CAPA 2: WebView SIN wrapper animado
          
          ARQUITECTURA QUE FUNCIONA EN ANDROID:
          
          react-native-webview en Android NO tolera estar envuelto en un
          Animated.View que cambie sus propiedades (ni opacity ni scale).
          Causa crash java.lang.String cannot be cast to java.lang.Double
          durante createViewInstance. En iOS sí funciona.
          
          Solución: WebView siempre visible, sin animación propia. La 
          transición al webview se logra ÚNICAMENTE con el splash overlay
          haciendo fade out encima. El WebView ya está renderizado debajo
          desde el inicio (invisible porque el splash lo cubre). Cuando el
          splash hace fade, el WebView aparece naturalmente.
          
          Resultado visual: idéntico para el usuario. Cero animación del
          WebView, todo el trabajo lo hace el fade del overlay. */}
      <View style={styles.webviewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri }}
          style={styles.webview}
          containerStyle={styles.webviewContainer}
          androidLayerType="hardware"
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
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
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScript={injectedJS}
        />
      </View>

      {/* CAPA 3: SPLASH OVERLAY — pantalla negra con la animación */}
      {showSplashContent && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { opacity: splashOpacity },
          ]}
        >
          {/* Línea aurora dopaminérgica (paleta aleatoria) */}
          <Animated.View
            style={[
              styles.lineContainer,
              {
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

      {/* BACK BUTTON */}
      {canGoBack && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={() => webViewRef.current && webViewRef.current.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonInner}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.backText}>Atrás</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  // Fondo negro persistente — la base que nunca cambia
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  // WebView wrapper con transformaciones
  webviewWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  webview: { flex: 1, backgroundColor: '#000000' },
  webviewContainer: { backgroundColor: '#000000' },

  overlay: {
    backgroundColor: '#000000',
    zIndex: 999,
    overflow: 'hidden',
  },

  // Línea aurora — barra horizontal centrada verticalmente
  // FIX Android: NO usar 'top: 50%' (string) — Android lo rechaza con
  // java.lang.String cannot be cast to java.lang.Double. iOS lo toleraba.
  // Calculamos la posición numérica directamente.
  lineContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 1.25,
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

  // Back button
  backButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: 'rgba(20, 20, 24, 0.95)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '400',
    marginRight: 4,
    marginTop: -2,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});