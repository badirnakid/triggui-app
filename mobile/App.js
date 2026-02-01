import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS ULTRACUÁNTICO TODOPODEROSO
// ═══════════════════════════════════════════════════════════════════════════════
//
// ✨ SECUENCIA "EL DESPERTAR"
//
// [Tap icono - imagotipo]
//        ↓
// [OS Splash: splashmoon.png - mismo imagotipo]
//        ↓ (imperceptible)
// [Mi Splash: imagotipo cobra vida - glow + breathing]
//        ↓
// [Chispa aparece → explota]
//        ↓
// [Imagotipo se eleva]
//        ↓
// [Letras "triggui" emergen desde abajo]
//        ↓
// [Partículas flotan]
//        ↓
// [Zoom out → App]
//
// DOBLE BARRERA ANTI-FLASH:
// 1. WebView con opacity 0 hasta que esté listo
// 2. Overlay animado encima
//
// PERFORMANCE ANDROID:
// - androidLayerType="hardware" (GPU rendering)
// - cacheEnabled + cacheMode (evita recargas)
//
// ═══════════════════════════════════════════════════════════════════════════════

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [showSplashContent, setShowSplashContent] = useState(true);
  const hasHiddenOverlay = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 SISTEMA DE ANIMACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // Imagotipo
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  
  // Chispa y burst
  const sparkOpacity = useRef(new Animated.Value(0)).current;
  const sparkScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0)).current;
  
  // Letras "triggui"
  const textLogoOpacity = useRef(new Animated.Value(0)).current;
  const textLogoTranslateY = useRef(new Animated.Value(30)).current;
  const textLogoScale = useRef(new Animated.Value(0.9)).current;
  
  // Partículas
  const particles = useRef([...Array(6)].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(0),
    translateX: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;
  
  // Exit
  const exitScale = useRef(new Animated.Value(1)).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // ✨ ANIMACIÓN "EL DESPERTAR"
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // FASE 1: Logo breathing (inmediato - continuidad con OS splash)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.04,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // FASE 2: Chispa aparece (400ms)
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(sparkOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(sparkScale, {
          toValue: 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // FASE 3: Chispa explota + logo se eleva (500ms)
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        // Burst expande
        Animated.timing(burstScale, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Burst fade
        Animated.sequence([
          Animated.timing(burstOpacity, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(burstOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        // Chispa desaparece
        Animated.timing(sparkOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        // Logo se eleva
        Animated.timing(logoTranslateY, {
          toValue: -50,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // FASE 4: Letras "triggui" emergen (800ms)
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(textLogoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textLogoTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(textLogoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // FASE 5: Partículas (500ms+)
    particles.forEach((particle, index) => {
      const delay = 500 + (index * 100);
      const randomX = (Math.random() - 0.5) * 140;
      const randomEndY = -60 - (Math.random() * 80);
      const duration = 1200 + (Math.random() * 600);
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.translateY, {
            toValue: randomEndY,
            duration: duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: randomX,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.5),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔥 HIDE OVERLAY - Unificado con protección contra doble llamada
  // ═══════════════════════════════════════════════════════════════════════════
  const hideOverlay = useCallback(async () => {
    if (hasHiddenOverlay.current) return;
    hasHiddenOverlay.current = true;
    
    setIsReady(true);
    await SplashScreen.hideAsync();
    
    // Salida cinematográfica
    Animated.parallel([
      Animated.timing(exitScale, {
        toValue: 0.9,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplashContent(false);
    });
  }, [overlayOpacity, exitScale]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⏱️ FALLBACK TIMER - Diferenciado por plataforma
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const fallbackDelay = Platform.OS === 'android' ? 3500 : 2500;
    const timer = setTimeout(() => {
      if (!hasHiddenOverlay.current) {
        console.log('[Triggui] Fallback triggered');
        hideOverlay();
      }
    }, fallbackDelay);
    return () => clearTimeout(timer);
  }, [hideOverlay]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔙 BACK BUTTON ANDROID
  // ═══════════════════════════════════════════════════════════════════════════
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
  // 📨 ON MESSAGE - FIRST_PAINT desde WebView
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMessage = useCallback((event) => {
    if (event.nativeEvent.data === "FIRST_PAINT") {
      console.log('[Triggui] FIRST_PAINT received');
      hideOverlay();
    }
  }, [hideOverlay]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧭 NAVIGATION STATE
  // ═══════════════════════════════════════════════════════════════════════════
  const handleNavigationStateChange = useCallback((navState) => {
    const isHome = navState.url === uri || navState.url === uri + '/';
    setCanGoBack(!isHome && navState.canGoBack);
  }, []);

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
          
          // ═══════════════════════════════════════════════════════════════
          // 🎯 DOBLE BARRERA: opacity 0 hasta ready + overlay encima
          // ═══════════════════════════════════════════════════════════════
          style={[styles.webview, { opacity: isReady ? 1 : 0 }]}
          containerStyle={styles.webviewContainer}
          
          // ═══════════════════════════════════════════════════════════════
          // 🔥 PERFORMANCE ANDROID CRÍTICO
          // ═══════════════════════════════════════════════════════════════
          androidLayerType="hardware"
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          
          // Configuración base
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          overScrollMode="never"
          allowsBackForwardNavigationGestures={true}
          decelerationRate="normal"
          
          // Cookies y media
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          
          // Handlers
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
              { transform: [{ scale: exitScale }] }
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF5E00',
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  burst: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF5E00',
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 35,
    elevation: 15,
  },
  logo: {
    width: 90,
    height: 90,
  },
  textLogoContainer: {
    marginTop: 10,
  },
  textLogo: {
    width: 160,
    height: 45,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔙 BACK BUTTON - Pill Premium
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
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    marginRight: 6,
    marginTop: -2,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
