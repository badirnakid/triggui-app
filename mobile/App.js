import { SafeAreaView, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect } from 'react';

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);

  // Manejo del botón físico "Back" en Android (volver dentro del WebView)
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
        startInLoadingState

        // 🔥 Fix 1: sin highlight azul en Android
        injectedJavaScript={`
          const css = '* { -webkit-tap-highlight-color: rgba(0,0,0,0); }';
          const style = document.createElement('style');
          style.appendChild(document.createTextNode(css));
          document.head.appendChild(style);
          true;
        `}

        // 🔥 Fix 2: sin rebotes ni vibraciones
        overScrollMode="never"
        androidLayerType="hardware"
      />
    </SafeAreaView>
  );
}
