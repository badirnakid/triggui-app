import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Evita que el splash desaparezca automáticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Simulamos retardo elegante del splash (ej. 2500ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsReady(true);
      await SplashScreen.hideAsync();
    }, 2500); // <- ajusta el tiempo aquí (2000–3000ms es elegante)
    return () => clearTimeout(timer);
  }, []);

  // Manejo del botón físico "Back" en Android
  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true; // evita que cierre la app
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  if (!isReady) {
    // Mientras no esté listo, mantenemos splash activo
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0f1b' }}>
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"   // evita rebotes
        androidLayerType="software" // quita highlight azul
      />
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </SafeAreaView>
  );
}
