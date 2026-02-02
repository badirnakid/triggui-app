import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGUI APP.JS - MOONRISE
// ═══════════════════════════════════════════════════════════════════════════════

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [exitTriggered, setExitTriggered] = useState(false);
  const [showSplashContent, setShowSplashContent] = useState(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // VALORES ANIMADOS - SOLO LO ESENCIAL
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // Isotipo - empieza visible y centrado (match con splash nativo)
  const isoOpacity = useRef(new Animated.Value(1)).current;
  const isoTranslateY = useRef(new Animated.Value(0)).current;
  
  // Texto - empieza invisible, aparecerá debajo
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(15)).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // MOONRISE - La luna sube, revela el nombre
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const runAnimation = async () => {
      // Sincronizar con splash nativo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        await SplashScreen.hideAsync();
      } catch (e) { 
        console.warn(e); 
      }

      // Pequeña pausa para que el ojo se asiente
      await new Promise(resolve => setTimeout(resolve, 200));

      // LA REVELACIÓN - Un solo movimiento coordinado
      Animated.parallel([
        // El isotipo sube suavemente
        Animated.timing(isoTranslateY, {
          toValue: -35,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        // El texto aparece con fade y sube ligeramente
        Animated.sequence([
          Animated.delay(150), // Empieza un poco después
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(textTranslateY, {
              toValue: 0,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        // Pausa para leer la marca
        setTimeout(() => {
          setAnimationFinished(true);
        }, 600);
      });
    };

    runAnimation();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SALIDA - Fade limpio hacia la app
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);
      
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowSplashContent(false));
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

      {/* SPLASH OVERLAY */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        {showSplashContent && (
          <View style={styles.brandContainer}>
            
            {/* ISOTIPO */}
            <Animated.View
              style={[
                styles.isoContainer,
                {
                  opacity: isoOpacity,
                  transform: [{ translateY: isoTranslateY }],
                }
              ]}
            >
              <Image
                source={require('./assets/logo_iso.png')}
                style={styles.logoIso}
                resizeMode="contain"
                fadeDuration={0}
              />
            </Animated.View>

            {/* TEXTO */}
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                }
              ]}
            >
              <Image
                source={require('./assets/logo_text.png')}
                style={styles.logoText}
                resizeMode="contain"
                fadeDuration={0}
              />
            </Animated.View>

          </View>
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
  container: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  webviewWrapper: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  webview: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  webviewContainer: { 
    backgroundColor: '#000000' 
  },

  overlay: {
    backgroundColor: '#000000',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  isoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoIso: {
    width: 120,
    height: 120,
  },

  textContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  
  logoText: {
    width: 180,
    height: 50,
  },

  // Back Button
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
