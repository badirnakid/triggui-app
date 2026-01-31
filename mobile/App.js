import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRIGGUI APP.JS - NIVEL DIOS TODOPODEROSO (FUSIÓN DEFINITIVA)
// ═══════════════════════════════════════════════════════════════════════════════
// DOBLE BARRERA ANTI-FLASH:
// 1. WebView con opacity 0 hasta que esté listo (Gemini)
// 2. Overlay negro animado encima (Claude)
// 
// PERFORMANCE ANDROID:
// - androidLayerType="hardware" (GPU rendering)
// - cacheEnabled + cacheMode (evita recargas)
// 
// OPTIMIZACIONES:
// - useCallback para evitar re-renders
// - Fallback diferenciado: 3.5s Android / 2.5s iOS
// - Protección contra doble ejecución
// ═══════════════════════════════════════════════════════════════════════════════

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const hasHiddenOverlay = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔥 HIDE OVERLAY - Unificado con protección contra doble llamada
  // ═══════════════════════════════════════════════════════════════════════════
  const hideOverlay = useCallback(async () => {
    if (hasHiddenOverlay.current) return;
    hasHiddenOverlay.current = true;
    
    setIsReady(true);
    await SplashScreen.hideAsync();
    
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity]);

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
          🖤 OVERLAY NEGRO - Segunda barrera anti-flash
          ═══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          🔙 BOTTOM BAR
          ═══════════════════════════════════════════════════════════════════ */}
      {canGoBack && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => webViewRef.current && webViewRef.current.goBack()}
            style={styles.backButton}
            accessibilityLabel="Regresar"
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹</Text>
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
  overlay: {
    backgroundColor: '#000000',
    zIndex: 999,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    zIndex: 1000,
  },
  backButton: {
    paddingHorizontal: 40,
    height: '100%',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 4,
  },
});
