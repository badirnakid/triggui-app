import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const uri = 'https://app.triggui.com';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0f1b' }}>
      <WebView
        source={{ uri }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
      />
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </SafeAreaView>
  );
}
