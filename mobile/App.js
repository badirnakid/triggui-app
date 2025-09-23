import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Mantener splash hasta que decidamos ocultarlo (ignoramos cualquier warning/edge)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Control de splash con retardo
useEffect(() => {
  const timer = setTimeout(async () => {
    if (!isReady) {
      setIsReady(true);
      await SplashScreen.hideAsync();
    }
  }, 5000); // backup 5s
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
    await SplashScreen.hideAsync();
  }
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
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </SafeAreaView>
  );
}
