import { useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

// Prevenir que el splash desaparezca automáticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);

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

  // Cuando la web ya terminó de cargar → ocultamos splash
  const handleLoadEnd = useCallback(async () => {
    await SplashScreen.hideAsync(); // fade automático de Expo
  }, []);

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
        overScrollMode="never"
        androidLayerType="software" // elimina highlight azul feo
        androidHardwareAccelerationDisabled={false}
        onLoadEnd={handleLoadEnd}
      />
    </SafeAreaView>
  );
}
