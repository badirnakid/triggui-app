import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS "LIQUID MOTION"
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 VALORES ANIMADOS (FÍSICA DE FLUIDOS)
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // Imagotipo (Comienza invisible para evitar flash)
  const logoOpacity = useRef(new Animated.Value(0)).current; 
  // Escala inicial pequeña para igualar tu splashmoon.png chico
  const logoScale = useRef(new Animated.Value(0.6)).current; 
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  
  // Texto
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textScale = useRef(new Animated.Value(0.9)).current;
  
  // Efectos Atmosféricos
  const burstScale = useRef(new Animated.Value(0.1)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  
  // Partículas (Flotación orgánica)
  const particles = useRef([...Array(8)].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(0),
    translateX: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 COREOGRAFÍA "THE BIG BANG"
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const runAnimation = async () => {
      // 1. Ocultar Splash Nativo SUAVEMENTE
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        await SplashScreen.hideAsync();
        // Aparecer nuestro logo instantáneamente (match visual)
        logoOpacity.setValue(1); 
      } catch (e) { console.warn(e); }

      // 2. SECUENCIA CINEMÁTICA
      Animated.sequence([
        // FASE A: ANTICIPACIÓN (Inhalar)
        // El logo se contrae ligeramente y brilla, acumulando energía
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 0.55, // Se encoge un poco más
            duration: 600,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),

        // FASE B: DETONACIÓN (Exhalar)
        // El logo dispara hacia arriba, crece y revela el texto
        Animated.parallel([
          // 1. El Logo crece y sube (Elástico)
          Animated.spring(logoScale, {
            toValue: 1, // Tamaño final heroico
            friction: 6, // Rebote bajo (pesado)
            tension: 40, // Velocidad
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: -60, // Sube para dejar espacio
            duration: 800,
            easing: Easing.bezier(0.1, 0.57, 0.1, 1), // Curva exponencial suave
            useNativeDriver: true,
          }),

          // 2. Onda expansiva (Burst)
          Animated.sequence([
            Animated.parallel([
              Animated.timing(burstOpacity, { toValue: 0.4, duration: 100, useNativeDriver: true }),
              Animated.timing(burstScale, { toValue: 1.5, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(burstOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),

          // 3. El Texto se despliega (Staggered - un poco después del inicio)
          Animated.sequence([
            Animated.delay(150), // Espera a que el logo empiece a subir
            Animated.parallel([
              Animated.timing(textOpacity, { 
                toValue: 1, 
                duration: 600, 
                useNativeDriver: true 
              }),
              Animated.spring(textTranslateY, { 
                toValue: 0, 
                friction: 7, 
                tension: 40, 
                useNativeDriver: true 
              }),
              Animated.spring(textScale, { 
                toValue: 1, 
                friction: 7, 
                useNativeDriver: true 
              }),
            ]),
          ]),
        ]),
        
        // FASE C: ESTABILIZACIÓN (Breathing final)
        Animated.delay(200),
      ]).start(() => setAnimationFinished(true));

      // FASE D: AMBIENTE (Partículas en segundo plano)
      // Se mueven más lento y orgánico
      particles.forEach((p, i) => {
        const delay = 400 + (i * 100);
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 0.6, duration: 500, useNativeDriver: true }),
            Animated.timing(p.translateY, { 
              toValue: -150 - (Math.random() * 100), 
              duration: 2500, 
              easing: Easing.out(Easing.cubic), 
              useNativeDriver: true 
            }),
            Animated.timing(p.scale, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(p.opacity, { 
              toValue: 0, 
              duration: 1500, 
              delay: 500, 
              useNativeDriver: true 
            }),
          ])
        ]).start();
      });
    };

    runAnimation();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚪 SALIDA: "THE PORTAL"
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);
      Animated.parallel([
        // Zoom IN inmersivo (entras a la app)
        Animated.timing(exitScale, { 
          toValue: 5, // Zoom exagerado para efecto de "entrar"
          duration: 600, 
          easing: Easing.in(Easing.cubic), 
          useNativeDriver: true 
        }),
        Animated.timing(overlayOpacity, { 
          toValue: 0, 
          duration: 400, 
          delay: 100, // Espera un poco a que empiece el zoom
          useNativeDriver: true 
        })
      ]).start(() => setShowSplashContent(false));
    }
  }, [animationFinished, webViewReady, exitTriggered]);

  // Fallback de seguridad (8s)
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
            
            {/* Glow de Fondo (Ambiental) */}
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            {/* Onda Expansiva */}
            <Animated.View style={[styles.burst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]} />
            
            {/* Partículas */}
            {particles.map((p, i) => (
              <Animated.View key={i} style={[styles.particle, {
                opacity: p.opacity,
                transform: [{ translateX: p.translateX }, { translateY: p.translateY }, { scale: p.scale }],
                backgroundColor: i % 2 === 0 ? '#FF5E00' : '#FF0055',
                width: 4 + (i % 2), height: 4 + (i % 2)
              }]} />
            ))}

            {/* CONTENEDOR CENTRAL */}
            <View style={styles.centerContainer}>
              
              {/* IMAGOTIPO (Iso) */}
              <Animated.View style={[styles.logoContainer, {
                opacity: logoOpacity,
                transform: [
                  { translateY: logoTranslateY }, 
                  { scale: logoScale } // Scale animado por spring
                ]
              }]}>
                <Image
                  source={require('./assets/logo_iso.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </Animated.View>

              {/* LETRAS (Texto) */}
              {/* Posicionado absolutamente para control preciso */}
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
    position: 'absolute', 
    top: 0, bottom: 0, left: 0, right: 0,
  },
  
  // Elementos Atmosféricos
  glow: {
    position: 'absolute',
    width: 300, height: 300,
    borderRadius: 150,
    backgroundColor: '#FF5E00',
    opacity: 0, // Controlado por animación
    transform: [{ scale: 1.5 }],
    zIndex: 5,
    // Hack para blur en Android sin tronar memoria
    shadowColor: '#FF5E00', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.2, shadowRadius: 50, elevation: 0
  },
  burst: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: '#ffffff',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 5,
    zIndex: 12,
  },
  
  // Logos
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  logo: {
    // 🔥 AJUSTE CRÍTICO: 
    // Empezamos con un tamaño de renderizado generoso (180), 
    // PERO la animación 'logoScale' lo inicia en 0.6 (108px) para igualar tu splash chico.
    // Luego crece a 1.0 (180px) majestuosamente.
    width: 180, 
    height: 180,
  },
  
  textLogoContainer: {
    position: 'absolute', 
    top: '50%', // Centro vertical
    marginTop: 65, // Offset para quedar bajo el iso tras la animación
    zIndex: 19,
    alignItems: 'center',
  },
  textLogo: {
    width: 200, 
    height: 60,
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
