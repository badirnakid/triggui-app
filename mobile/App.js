import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, BackHandler, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Mantener splash hasta que decidamos ocultarlo
SplashScreen.preventAutoHideAsync();

export default function App() {
  const uri = 'https://app.triggui.com';
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(uri);

  // Control de splash con retardo
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsReady(true);
      await SplashScreen.hideAsync();
    }, 2500); // 2.5s
    return () => clearTimeout(timer);
  }, []);

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

  const isStripe = currentUrl.includes('stripe.com');

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {isStripe ? (
        // Stripe → con SafeArea
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
            onNavigationStateChange={(event) => setCurrentUrl(event.url)}
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
      ) : (
        // Bloques → fullscreen absoluto
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
          onNavigationStateChange={(event) => setCurrentUrl(event.url)}
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
      )}
    </View>
  );
}
