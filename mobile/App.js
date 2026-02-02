import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS (OPTIMIZADO PARA MEMORIA Y ESTABILIDAD)
// ═══════════════════════════════════════════════════════════════════════════════

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
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const sparkOpacity = useRef(new Animated.Value(0)).current;
  const sparkScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0)).current;
  const textLogoOpacity = useRef(new Animated.Value(0)).current;
  const textLogoTranslateY = useRef(new Animated.Value(40)).current;
  const textLogoScale = useRef(new Animated.Value(0.9)).current;
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
        await new Promise(resolve => setTimeout(resolve, 200)); 
        await SplashScreen.hideAsync();
      } catch (e) { console.warn(e); }
    };
    hideNativeSplash();

    // Breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Secuencia Principal
    Animated.sequence([
      Animated.delay(300), 

      // Chispa
      Animated.parallel([
        Animated.timing(sparkOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(sparkScale, { toValue: 1, tension: 180, friction: 12, useNativeDriver: true }),
      ]),

      // Explosión y Elevación
      Animated.parallel([
        Animated.timing(burstScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(burstOpacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
          Animated.timing(burstOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.timing(sparkOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: -70, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),

      // Texto
      Animated.parallel([
        Animated.timing(textLogoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(textLogoTranslateY, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.spring(textLogoScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      ]),

      Animated.delay(200), 
    ]).start(() => setAnimationFinished(true));

    // Partículas (Optimizadas)
    particles.forEach((particle, index) => {
      const delay = 1000 + (index * 150);
      const randomX = (Math.random() - 0.5) * 140;
      const randomEndY = -100 - (Math.random() * 60);
      const duration = 1800 + (Math.random() * 600);
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.opacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
          Animated.timing(particle.scale, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(particle.translateY, { toValue: randomEndY, duration: duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(particle.translateX, { toValue: randomX, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(duration * 0.3),
            Animated.timing(particle.opacity, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
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
        Animated.timing(exitScale, { toValue: 1.3, duration: 400, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
      ]).start(() => setShowSplashContent(false));
    }
  }, [animationFinished, webViewReady, exitTriggered]);

  // Fallback de seguridad extendido
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
            {/* Spark - Elevation reducida para evitar bugs gráficos */}
            <Animated.View style={[styles.spark, { opacity: sparkOpacity, transform: [{ scale: sparkScale }] }]} />
            <Animated.View style={[styles.burst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]} />
            
            {particles.map((p, i) => (
              <Animated.View key={i} style={[styles.particle, {
                opacity: p.opacity,
                transform: [{ translateX: p.translateX }, { translateY: p.translateY }, { scale: p.scale }],
                backgroundColor: i % 2 === 0 ? '#FF5E00' : '#FF0055',
                width: 4 + (i % 2), height: 4 + (i % 2)
              }]} />
            ))}

            {/* IMAGOTIPO */}
            <Animated.View style={[styles.logoContainer, {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }, { scale: Animated.multiply(logoScale, logoPulse) }]
            }]}>
              <Image
                source={require('./assets/logo_iso.png')} 
                style={styles.logo}
                resizeMode="contain"
                fadeDuration={0} // Evita parpadeo en Android
              />
            </Animated.View>

            {/* LETRAS */}
            <Animated.View style={[styles.textLogoContainer, {
              opacity: textLogoOpacity,
              transform: [{ translateY: textLogoTranslateY }, { scale: textLogoScale }]
            }]}>
              <Image
                source={require('./assets/logo_text.png')}
                style={styles.textLogo}
                resizeMode="contain"
                fadeDuration={0} // Evita parpadeo en Android
              />
            </Animated.View>
          </Animated.View>
        )}
      </Animated.View>

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
  spark: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10, // Reducido para estabilidad
    zIndex: 20,
  },
  burst: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF5E00',
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 5,
    zIndex: 5,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  logo: {
    width: 180, // Tamaño grande nivel dios
    height: 180,
  },
  textLogoContainer: {
    marginTop: 20,
    zIndex: 15,
  },
  textLogo: {
    width: 200,
    height: 55,
  },
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
