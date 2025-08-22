import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isStripe, setIsStripe] = useState(false);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#000000',
          paddingTop: isStripe && Platform.OS === 'android' ? 24 : 0, // deja espacio solo en Stripe
        }}
      >
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
          androidLayerType="software"   // elimina efecto azul
          overScrollMode="never"
          onNavigationStateChange={(navState) => {
            setIsStripe(navState.url.includes('stripe.com'));
          }}
        />
      </SafeAreaView>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
