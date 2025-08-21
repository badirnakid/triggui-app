import { SafeAreaView, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect } from 'react';

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);

  // Botón físico "Back" en Android
  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
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
        overScrollMode="never"
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        injectedJavaScript={`
          const style = document.createElement('style');
          style.innerHTML = '* { -webkit-tap-highlight-color: transparent; }';
          document.head.appendChild(style);
          true;
        `}
      />
    </SafeAreaView>
  );
}
