import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS (CORREGIDO: ASSETS SEGUROS Y TAMAÑO)
// ═══════════════════════════════════════════════════════════════════════════════

// Mantener el splash nativo visible hasta que nosotros digamos
SplashScreen.preventAutoHideAsync().catch(() => {});

const { width, height } = Dimensions.get('window');

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  
  // ESTADOS DE CONTROL DE FLUJO
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false); 
  const [animationFinished, setAnimationFinished] = useState(false); 
  const [exitTriggered, setExitTriggered] = useState(false); 
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
    // 1. Ocultar Splash Nativo RÁPIDO
    const hideNativeSplash = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 150)); 
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    };
    hideNativeSplash();

    // 2. Iniciar Secuencia
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulseAnim.start();

    // SECUENCIA PRINCIPAL
    Animated.sequence([
      Animated.delay(300), 

      // FASE B: Chispa
      Animated.parallel([
        Animated.timing(sparkOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.spring(sparkScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
      ]),

      // FASE C: Explosión y Elevación
      Animated.parallel([
        Animated.timing(burstScale, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(burstOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
          Animated.timing(burstOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.timing(sparkOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: -60, duration: 600, easing: Easing.out(Easing.quart), useNativeDriver: true }),
      ]),

      // FASE D: Aparición de Letras
      Animated.parallel([
        Animated.timing(textLogoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textLogoTranslateY, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(textLogoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),

      Animated.delay(100), 
    ]).start(() => {
      setAnimationFinished(true);
    });

    // Partículas
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
  // 🚪 SALIDA
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);
      performExitAnimation();
    }
  }, [animationFinished, webViewReady, exitTriggered]);

  const performExitAnimation = () => {
    Animated.parallel([
      Animated.timing(exitScale, {
        toValue: 1.5, // Zoom OUT más agresivo (efecto entrar a la app)
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSplashContent(false);
    });
  };

  // Fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!exitTriggered) {
        setWebViewReady(true); 
        setAnimationFinished(true); 
      }
    }, 6000); 
    return () => clearTimeout(timer);
  }, [exitTriggered]);

  // Mensaje del WebView
  const handleMessage = useCallback((event) => {
    if (event.nativeEvent.data === "FIRST_PAINT") {
      setWebViewReady(true);
    }
  }, []);

  // Navegación
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
                { opacity: sparkOpacity, transform: [{ scale: sparkScale }] }
              ]}
            />

            {/* 💥 BURST */}
            <Animated.View
              style={[
                styles.burst,
                { opacity: burstOpacity, transform: [{ scale: burstScale }] }
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

            {/* 🎯 IMAGOTIPO - CORREGIDO (NUEVO NOMBRE SIN ESPACIOS) */}
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
                // ⚠️ AQUÍ ESTABA EL ERROR FATAL: Nombres con espacios truenan Android
                source={require('./assets/logo_iso.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* 📝 LETRAS - CORREGIDO (NUEVO NOMBRE SIN ESPACIOS) */}
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
                // ⚠️ AQUÍ ESTABA EL ERROR FATAL: Nombres con espacios truenan Android
                source={require('./assets/logo_text.png')}
                style={styles.textLogo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        )}
      </Animated.View>

      {/* 🔙 BOTÓN BACK */}
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
// 🎨 ESTILOS (Aumentados para corregir "lejano")
// ═══════════════════════════════════════════════════════════════════════════════
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
  spark: {
    position: 'absolute',
    width: 24, // Aumentado
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 25,
    zIndex: 20,
  },
  burst: {
    position: 'absolute',
    width: 250, // Aumentado
    height: 250,
    borderRadius: 125,
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
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  logo: {
    // 🔥 AJUSTE DE TAMAÑO: De 120 a 180 para que no se vea "lejano"
    width: 180, 
    height: 180,
  },
  textLogoContainer: {
    marginTop: 20,
    zIndex: 15,
  },
  textLogo: {
    width: 220, // Aumentado proporcionalmente
    height: 60,
  },

  // Estilos del Botón Back
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
