import React, { useCallback, useRef, useState, useEffect } from "react";
import { BackHandler, Linking, Platform, SafeAreaView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import WebView, { WebViewNavigation } from "react-native-webview";

const APP_URL = "https://app.triggui.com";
const ALLOWED_HOST = "app.triggui.com";

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [offline, setOffline] = useState(false);

  // Control botón atrás en Android
  useEffect(() => {
    if (Platform.OS === "android") {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack && webRef.current) {
          webRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }
  }, [canGoBack]);

  const onNav = (nav: WebViewNavigation) => setCanGoBack(nav.canGoBack);

  // Control de navegación segura
  const onShouldStart = useCallback((req: any) => {
    try {
      const url = new URL(req.url);
      if (url.host === ALLOWED_HOST) return true; // interno
      Linking.openURL(req.url); // externo
      return false;
    } catch {
      return false;
    }
  }, []);

  // Botón compartir
  const share = async () => {
    try {
      await Share.share({ message: "Triggui — Abre un libro: https://triggui.com" });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topbar}>
        <Text style={styles.title}>Triggui</Text>
        <TouchableOpacity onPress={share} style={styles.shareBtn}>
          <Text style={styles.shareTxt}>Compartir</Text>
        </TouchableOpacity>
      </View>

      {offline ? (
        <View style={styles.offline}>
          <Text style={styles.offlineTitle}>Sin conexión</Text>
          <Text style={styles.offlineTxt}>Revisa tu Internet y vuelve a abrir la app.</Text>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: APP_URL }}
          onNavigationStateChange={onNav}
          onShouldStartLoadWithRequest={onShouldStart}
          startInLoadingState
          onError={() => setOffline(true)}
          onHttpError={() => setOffline(true)}
          pullToRefreshEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          originWhitelist={["*"]}
          style={{ backgroundColor: "#000" }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: {
    height: 48,
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  shareBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#111"
  },
  shareTxt: { color: "#fff", fontSize: 13 },
  offline: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24
  },
  offlineTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  offlineTxt: { color: "#bbb", fontSize: 14, textAlign: "center" }
});
