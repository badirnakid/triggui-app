import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Mantener splash hasta que decidamos ocultarlo (ignoramos cualquier warning/edge)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

    const hideOverlay = async () => {
    await SplashScreen.hideAsync();
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 400, // transición elegante
      useNativeDriver: true,
    }).start();
  };



// Control de splash con retardo (fallback)
useEffect(() => {
   const timer = setTimeout(async () => {
    if (!isReady) {
      setIsReady(true);
      hideOverlay();
    }
  }, 1500); // backup 1.5s más rápido

  return () => clearTimeout(timer);
}, [isReady]);



  // Back físico en Android
  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);

  if (!isReady) return null; // splash activo

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
 <WebView
  ref={webViewRef}
  source={{ uri }}
  style={{ flex: 1, backgroundColor: '#000000' }} // 🔑 evita pantallazo blanco
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
allowsBackForwardNavigationGestures={true} // iOS: gesto nativo atrás/adelante si hay historial

onLoadEnd={async () => {
  if (!isReady) {
    setIsReady(true);
    hideOverlay();
  }
}}



onNavigationStateChange={(navState) => {
  const isHome = navState.url.startsWith('https://app.triggui.com');
  setCanGoBack(!isHome && navState.canGoBack);
}}

        // 🔥 Inyectamos CSS para quitar highlight azul en Android
        injectedJavaScript={`
          const css = \`
            * { -webkit-tap-highlight-color: transparent !important; }
            *:focus { outline: none !important; }
            button, a { outline: none !important; }
          \`;
          const style = document.createElement('style');
          style.innerHTML = css;
          document.head.appendChild(style);
          true;
        `}
      />

     {/* Overlay negro que tapa el flash blanco y se desvanece */}
     <Animated.View
       pointerEvents="none"
       style={{
         ...StyleSheet.absoluteFillObject,
         backgroundColor: '#000',
         opacity: overlayOpacity,
       }}
     />
        
        
      <StatusBar style="light" />

         {canGoBack && (
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: '#000',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopWidth: 1,
          borderTopColor: '#222',
        }}
      >
        <TouchableOpacity
          onPress={() => {
  if (webViewRef.current && canGoBack) {
    webViewRef.current.goBack();
  }
}}

          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          accessibilityLabel="Regresar"
        >
          <Text style={{ color: '#fff', fontSize: 32 }} accessible={false}>‹</Text>
        </TouchableOpacity>
      </View>
    )}
    </SafeAreaView>
  );
}
