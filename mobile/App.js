import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS (CORREGIDO PARA FORZAR ANIMACIÓN)
// ═══════════════════════════════════════════════════════════════════════════════

// Mantener el splash nativo visible hasta que nosotros digamos
SplashScreen.preventAutoHideAsync().catch(() => {});

const { width, height } = Dimensions.get('window');

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  
  // ESTADOS DE CONTROL DE FLUJO
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false); // ¿El webview ya cargó?
  const [animationFinished, setAnimationFinished] = useState(false); // ¿La intro ya acabó?
  const [exitTriggered, setExitTriggered] = useState(false); // Para evitar dobles ejecuciones
  const [showSplashContent, setShowSplashContent] = useState(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 VALORES ANIMADOS
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // Logo Principal (Imagotipo)
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  
  // Efectos (Chispa y Explosión)
  const sparkOpacity = useRef(new Animated.Value(0)).current;
  const sparkScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0)).current;
  
  // Texto "Triggui"
  const textLogoOpacity = useRef(new Animated.Value(0)).current;
  const textLogoTranslateY = useRef(new Animated.Value(40)).current;
  const textLogoScale = useRef(new Animated.Value(0.9)).current;
  
  // Partículas
  const particles = useRef([...Array(6)].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(0),
    translateX: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  // Zoom de Salida
  const exitScale = useRef(new Animated.Value(1)).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 SECUENCIA MAESTRA DE ANIMACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // 1. Ocultar Splash Nativo RÁPIDO para que nuestra View tome el control
    const hideNativeSplash = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 150)); // Pequeña espera para asegurar render
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    };
    hideNativeSplash();

    // 2. Iniciar Secuencia "El Despertar"
    // FASE A: Breathing del logo (mientras esperamos)
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulseAnim.start();

    // SECUENCIA PRINCIPAL (TIEMPO TOTAL APROX: 2500ms)
    Animated.sequence([
      // Pausa inicial para que el usuario procese el logo estático
      Animated.delay(300), 

      // FASE B: Chispa (El Impulso)
      Animated.parallel([
        Animated.timing(sparkOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.spring(sparkScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
      ]),

      // FASE C: Explosión y Elevación
      Animated.parallel([
        // Burst
        Animated.timing(burstScale, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(burstOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
          Animated.timing(burstOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        // Apagar chispa
        Animated.timing(sparkOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        // Elevar Logo
        Animated.timing(logoTranslateY, { toValue: -60, duration: 600, easing: Easing.out(Easing.quart), useNativeDriver: true }),
      ]),

      // FASE D: Aparición de Letras
      Animated.parallel([
        Animated.timing(textLogoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textLogoTranslateY, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(textLogoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),

      // FASE E: Partículas Mágicas
      Animated.delay(100), // Pequeña pausa antes de partículas
    ]).start(() => {
      // 🚩 MARCANDO EL FIN DE LA INTRO
      // Esto le dice al sistema: "Ya acabé mi show, ahora sí podemos irnos si el webview está listo"
      setAnimationFinished(true);
    });

    // Disparar partículas independientemente para no bloquear la secuencia
    particles.forEach((particle, index) => {
      const delay = 900 + (index * 120);
      const randomX = (Math.random() - 0.5) * 160;
      const randomEndY = -80 - (Math.random() * 80);
      const duration = 1500 + (Math.random() * 500);
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.opacity, { toValue: 0.8, duration: 200, useNativeDriver: true }),
          Animated.timing(particle.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
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
  // 🚪 SALIDA COORDINADA (The Gatekeeper)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Solo salimos si AMBAS cosas sucedieron:
    // 1. La animación terminó (setAnimationFinished(true))
    // 2. El WebView cargó (setWebViewReady(true))
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);
      performExitAnimation();
    }
  }, [animationFinished, webViewReady, exitTriggered]);

  const performExitAnimation = () => {
    Animated.parallel([
      Animated.timing(exitScale, {
        toValue: 1.2, // Zoom IN ligero antes de desaparecer (efecto cámara)
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSplashContent(false);
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ⏱️ FALLBACK DE SEGURIDAD (Por si el WebView falla en avisar)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const timer = setTimeout(() => {
      // Si pasaron 6 segundos y no hemos salido, forzamos salida
      if (!exitTriggered) {
        console.log('[Triggui] Fallback de seguridad activado');
        setWebViewReady(true); 
        setAnimationFinished(true); // Forzamos true para activar el useEffect de salida
      }
    }, 6000); 
    return () => clearTimeout(timer);
  }, [exitTriggered]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 📨 ON MESSAGE - FIRST_PAINT desde WebView
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMessage = useCallback((event) => {
    if (event.nativeEvent.data === "FIRST_PAINT") {
      console.log('[Triggui] FIRST_PAINT recibido');
      setWebViewReady(true);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧭 NAVIGATION & BACK HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  const handleNavigationStateChange = useCallback((navState) => {
    const isHome = navState.url === uri || navState.url === uri + '/';
    setCanGoBack(!isHome && navState.canGoBack);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backAction = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 💉 INJECTED JS
  // ═══════════════════════════════════════════════════════════════════════════
  const injectedJS = `
    (function() {
      var css = \`
        * { 
          -webkit-tap-highlight-color: transparent !important; 
          -webkit-touch-callout: none !important;
          user-select: none;
          -webkit-user-select: none;
        }
        *:focus { outline: none !important; }
        input, textarea { user-select: text; -webkit-user-select: text; }
      \`;
      var style = document.createElement('style');
      style.innerHTML = css;
      document.head.appendChild(style);
      
      if (window.ReactNativeWebView) {
        // Avisar inmediatamente, React Native decidirá cuándo mostrar
        requestAnimationFrame(function() {
          window.ReactNativeWebView.postMessage("FIRST_PAINT");
        });
      }
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
          style={[styles.webview, { opacity: exitTriggered ? 1 : 0 }]} // Opacidad controlada por el trigger final
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

      {/* ═══════════════════════════════════════════════════════════════════
          ✨ SPLASH ANIMADO - "El Despertar"
          ═══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        {showSplashContent && (
          <Animated.View 
            style={[
              styles.splashContent,
              { transform: [{ scale: exitScale }] } // Zoom de cámara al salir
            ]}
          >
            {/* 🔥 CHISPA */}
            <Animated.View
              style={[
                styles.spark,
                {
                  opacity: sparkOpacity,
                  transform: [{ scale: sparkScale }],
                }
              ]}
            />

            {/* 💥 BURST */}
            <Animated.View
              style={[
                styles.burst,
                {
                  opacity: burstOpacity,
                  transform: [{ scale: burstScale }],
                }
              ]}
            />

            {/* ✦ PARTÍCULAS */}
            {particles.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    opacity: particle.opacity,
                    transform: [
                      { translateX: particle.translateX },
                      { translateY: particle.translateY },
                      { scale: particle.scale },
                    ],
                    width: 3 + (index % 3) * 2,
                    height: 3 + (index % 3) * 2,
                    backgroundColor: index % 2 === 0 ? '#FF5E00' : '#FF0055',
                  }
                ]}
              />
            ))}

            {/* 🎯 IMAGOTIPO */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [
                    { translateY: logoTranslateY },
                    { scale: Animated.multiply(logoScale, logoPulse) },
                  ],
                }
              ]}
            >
              {/* NOTA: Ajusté el width/height para intentar igualar el tamaño visual del splash OS */}
              <Image
                source={require('./assets/Moonshot_logo_primary isotype white_C.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* 📝 LETRAS "TRIGGUI" */}
            <Animated.View
              style={[
                styles.textLogoContainer,
                {
                  opacity: textLogoOpacity,
                  transform: [
                    { translateY: textLogoTranslateY },
                    { scale: textLogoScale },
                  ],
                }
              ]}
            >
              <Image
                source={require('./assets/Triggui_Logo color.png')}
                style={styles.textLogo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        )}
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════════
          🔙 BOTÓN BACK - Pill Premium
          ═══════════════════════════════════════════════════════════════════ */}
      {canGoBack && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={() => webViewRef.current && webViewRef.current.goBack()}
            style={styles.backButton}
            accessibilityLabel="Regresar"
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

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 ESTILOS
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webviewContainer: {
    backgroundColor: '#000000',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ✨ SPLASH
  // ═══════════════════════════════════════════════════════════════════════════
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
  spark: {
    position: 'absolute',
    width: 20, // Más grande para mejor efecto
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff', // Centro blanco caliente
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 25,
    zIndex: 20,
  },
  burst: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF5E00',
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 5,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, // Glow sutil inicial
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  logo: {
    // ⚠️ AJUSTE CRÍTICO:
    // Aumenté el tamaño para intentar igualar el splash nativo. 
    // Si aún se ve chico, sube estos valores (ej: 140x140).
    width: 120, 
    height: 120,
  },
  textLogoContainer: {
    marginTop: 15,
    zIndex: 15,
  },
  textLogo: {
    width: 180,
    height: 50,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔙 BOTÓN BACK - Pill Premium
  // ═══════════════════════════════════════════════════════════════════════════
  backButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: 'rgba(20, 20, 24, 0.95)', // Casi negro sólido para mejor contraste
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
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
