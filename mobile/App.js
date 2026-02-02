import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet, Image, Easing } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGUI - APPROACHING STAR
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
  // VALORES ANIMADOS
  // ═══════════════════════════════════════════════════════════════════════════
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // Isotipo - empieza pequeño (lejano), se acerca y gira
  const isoOpacity = useRef(new Animated.Value(1)).current;
  const isoScale = useRef(new Animated.Value(0.7)).current;
  const isoRotate = useRef(new Animated.Value(0)).current;
  
  // Texto - empieza invisible, aparece cuando el iso desaparece
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.85)).current;

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROACHING STAR - Viene hacia ti, gira, se transforma
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const runAnimation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        await SplashScreen.hideAsync();
      } catch (e) { 
        console.warn(e); 
      }

      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 150));

      // FASE 1: El isotipo se acerca girando
      Animated.parallel([
        // Se acerca (scale up)
        Animated.timing(isoScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Gira sutilmente (media vuelta elegante)
        Animated.timing(isoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        
        // FASE 2: Transformación - iso desaparece, texto aparece
        Animated.parallel([
          // Iso se desvanece
          Animated.timing(isoOpacity, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Texto aparece y crece ligeramente
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Pausa para leer la marca
          setTimeout(() => {
            setAnimationFinished(true);
          }, 700);
        });
      });
    };

    runAnimation();
  }, []);

  // Interpolación de rotación
  const rotation = isoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SALIDA
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (animationFinished && webViewReady && !exitTriggered) {
      setExitTriggered(true);
      
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowSplashContent(false));
    }
  }, [animationFinished, webViewReady, exitTriggered]);

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
          <View style={styles.centerContainer}>
            
            {/* ISOTIPO - Se acerca y gira */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: isoOpacity,
                  transform: [
                    { scale: isoScale },
                    { rotate: rotation },
                  ],
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

            {/* TEXTO - Aparece cuando el iso desaparece */}
            <Animated.View
              style={[
                styles.logoContainer,
                styles.textAbsolute,
                {
                  opacity: textOpacity,
                  transform: [{ scale: textScale }],
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

  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  textAbsolute: {
    position: 'absolute',
  },
  
  logoIso: {
    width: 90,
    height: 90,
  },

  logoText: {
    width: 140,
    height: 40,
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
