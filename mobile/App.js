import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS (TRANSICIÓN CINEMÁTICA)
// ═══════════════════════════════════════════════════════════════════════════════

SplashScreen.preventAutoHideAsync().catch(() => {});

const { width, height } = Dimensions.get('window');

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  
  // ESTADOS
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false); 
  const [animationFinished, setAnimationFinished] = useState(false); 
  const [exitTriggered, setExitTriggered] = useState(false); 
  const [showSplashContent, setShowSplashContent] = useState(true);

  // VALORES ANIMADOS
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // Imagotipo (logo_iso)
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current; // Empieza en 0 (centro exacto)
  const logoPulse = useRef(new Animated.Value(1)).current;
  
  // Texto (logo_text)
  const textOpacity = useRef(new Animated.Value(0)).current; // Invisible al inicio
  const textTranslateY = useRef(new Animated.Value(20)).current; // Ligeramente abajo
  const textScale = useRef(new Animated.Value(0.95)).current;
  
  // Efectos
  const sparkOpacity = useRef(new Animated.Value(0)).current;
  const sparkScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  
  const particles = useRef([...Array(6)].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(0),
    translateX: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 SECUENCIA MAESTRA
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const hideNativeSplash = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Muy rápido para continuidad
        await SplashScreen.hideAsync();
      } catch (e) { console.warn(e); }
    };
    hideNativeSplash();

    // 1. Latido inicial (Continuidad visual con el icono pulsado)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // 2. Secuencia de Transformación
    Animated.sequence([
      Animated.delay(400), // Pausa dramática inicial

      // A. Chispa sutil (El "Trigger")
      Animated.parallel([
        Animated.timing(sparkOpacity, { toValue: 0.8, duration: 200, useNativeDriver: true }),
        Animated.spring(sparkScale, { toValue: 1, tension: 100, useNativeDriver: true }),
      ]),

      // B. Explosión + Movimiento (El despliegue)
      Animated.parallel([
        // Burst expande
        Animated.timing(burstScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(burstOpacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
          Animated.timing(burstOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        // Apagar chispa
        Animated.timing(sparkOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        
        // MOVER IMAGOTIPO HACIA ARRIBA (Para hacer espacio al texto)
        Animated.spring(logoTranslateY, { 
          toValue: -50, // Sube 50px
          tension: 40, 
          friction: 8, 
          useNativeDriver: true 
        }),

        // APARECER TEXTO (Entra suave desde abajo)
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(textTranslateY, { 
          toValue: 20, // Se queda posicionado debajo del logo
          tension: 40, 
          friction: 8, 
          useNativeDriver: true 
        }),
      ]),

      Animated.delay(300), // Pausa para admirar el logo completo
    ]).start(() => setAnimationFinished(true));

    // Partículas (Ambiente mágico)
    particles.forEach((particle, index) => {
      const delay = 800 + (index * 150);
      const randomX = (Math.random() - 0.5) * 120;
      const randomEndY = -100 - (Math.random() * 60);
      const duration = 2000 + (Math.random() * 500);
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.opacity, { toValue: 0.5, duration: 400, useNativeDriver: true }),
          Animated.timing(particle.translateY, { toValue: randomEndY, duration: duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(particle.translateX, { toValue: randomX, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(duration * 0.4),
            Animated.timing(particle.opacity, { toValue: 0, duration: duration * 0.6, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚪 SALIDA
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);
      Animated.parallel([
        // Zoom IN sutil (efecto inmersivo hacia la app)
        Animated.timing(exitScale, { 
          toValue: 1.1, 
          duration: 400, 
          easing: Easing.in(Easing.cubic), 
          useNativeDriver: true 
        }),
        Animated.timing(overlayOpacity, { 
          toValue: 0, 
          duration: 500, 
          useNativeDriver: true 
        })
      ]).start(() => setShowSplashContent(false));
    }
  }, [animationFinished, webViewReady, exitTriggered]);

  // Fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!exitTriggered) {
        setWebViewReady(true); 
        setAnimationFinished(true); 
      }
    }, 8000); 
    return () => clearTimeout(timer);
  }, [exitTriggered]);

  const handleMessage = useCallback((event) => {
    if (event.nativeEvent.data === "FIRST_PAINT") setWebViewReady(true);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />

      <View style={styles.webviewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri }}
          style={[styles.webview, { opacity: exitTriggered ? 1 : 0 }]}
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
          decelerationRate="normal"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScript={injectedJS}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}
      >
        {showSplashContent && (
          <Animated.View style={[styles.splashContent, { transform: [{ scale: exitScale }] }]}>
            
            {/* Spark & Burst */}
            <Animated.View style={[styles.spark, { opacity: sparkOpacity, transform: [{ scale: sparkScale }] }]} />
            <Animated.View style={[styles.burst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]} />
            
            {/* Particles */}
            {particles.map((p, i) => (
              <Animated.View key={i} style={[styles.particle, {
                opacity: p.opacity,
                transform: [{ translateX: p.translateX }, { translateY: p.translateY }, { scale: p.scale }],
                backgroundColor: i % 2 === 0 ? '#FF5E00' : '#FF0055',
                width: 4 + (i % 2), height: 4 + (i % 2)
              }]} />
            ))}

            {/* CONTENEDOR CENTRAL */}
            {/* Aquí está la clave: todo centrado verticalmente */}
            <View style={styles.centerContainer}>
              
              {/* IMAGOTIPO */}
              <Animated.View style={[styles.logoContainer, {
                opacity: logoOpacity,
                transform: [
                  { translateY: logoTranslateY }, 
                  { scale: Animated.multiply(logoScale, logoPulse) }
                ]
              }]}>
                <Image
                  source={require('./assets/logo_iso.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </Animated.View>

              {/* LETRAS */}
              {/* Posicionadas absolutamente respecto al centro para control total */}
              <Animated.View style={[styles.textLogoContainer, {
                opacity: textOpacity,
                transform: [
                  { translateY: textTranslateY }, 
                  { scale: textScale }
                ]
              }]}>
                <Image
                  source={require('./assets/logo_text.png')}
                  style={styles.textLogo}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </Animated.View>

            </View>
          </Animated.View>
        )}
      </Animated.View>

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
  webviewWrapper: { flex: 1, backgroundColor: '#000000' },
  webview: { flex: 1, backgroundColor: '#000000' },
  webviewContainer: { backgroundColor: '#000000' },
  
  overlay: {
    backgroundColor: '#000000',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Esto asegura que el centro geométrico sea la referencia
    position: 'absolute', 
    top: 0, bottom: 0, left: 0, right: 0,
  },
  
  // Elementos
  spark: {
    position: 'absolute',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#FF5E00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 25, elevation: 25,
    zIndex: 20,
  },
  burst: {
    position: 'absolute',
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: '#FF5E00',
    shadowColor: '#FF5E00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 30,
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 5,
    zIndex: 5,
  },
  
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    // Eliminamos margin bottom fijo para controlar posición con animated values
  },
  logo: {
    // TAMAÑO PERFECTO: Debe coincidir con splash nativo
    // 180 es un buen punto de partida para resizeMode="cover" en splash nativo
    width: 180, 
    height: 180,
  },
  
  textLogoContainer: {
    position: 'absolute', // Absoluto para que nazca "detrás/debajo" del centro
    top: '50%', // Centrado vertical inicial
    zIndex: 14, // Debajo del logo_iso
    alignItems: 'center',
  },
  textLogo: {
    width: 180, // Ancho proporcional
    height: 50,
    marginTop: 60, // Offset inicial para que no se traslape con el iso al inicio
  },

  // Back Button
  backButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: 'rgba(20, 20, 24, 0.95)',
    borderRadius: 30,
    paddingVertical: 12, paddingHorizontal: 24,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  backButtonInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  backChevron: {
    color: '#FFFFFF', fontSize: 22, fontWeight: '400', marginRight: 4, marginTop: -2,
  },
  backText: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.5,
  },
});
