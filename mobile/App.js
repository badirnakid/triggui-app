import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Mantén splash hasta que nosotros lo ocultemos
SplashScreen.preventAutoHideAsync();

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Delay elegante del splash
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsReady(true);
      await SplashScreen.hideAsync();
    }, 2500); // Ajusta 2000–3000ms
    return () => clearTimeout(timer);
  }, []);

  // Manejo del botón físico "Back" en Android
  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true; // evita cierre de app
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);

  if (!isReady) return null; // Splash activo

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        injectedJavaScript={`
          const css = '*:focus { outline: none !important; } ::-webkit-tap-highlight-color { transparent; }';
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
