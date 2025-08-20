import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  BackHandler, 
  Platform 
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";

// Mantener splash visible hasta que cargue
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const webViewRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animación de respiración del logo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simula carga inicial (2.5s máx)
    setTimeout(async () => {
      setIsReady(true);
      await SplashScreen.hideAsync();
    }, 2500);

    // Monitorear conexión a internet
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Manejar botón Back en Android
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (webViewRef.current) {
            webViewRef.current.goBack();
            return true; // evita cerrar la app
          }
          return false;
        }
      );
      return () => backHandler.remove();
    }
  }, []);

  // Si no hay conexión → mensaje elegante
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>
          Necesitas conexión a internet para abrir TrigguiApp
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isReady ? (
        // Splash animado
        <View style={styles.splash}>
          <Animated.Image
            source={require("./assets/icon.png")} // tu logo
            style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
          <Text style={styles.splashText}>TrigguiApp</Text>
        </View>
      ) : (
        // WebView cargando triggui.com
        <WebView
          ref={webViewRef}
          source={{ uri: "https://app.triggui.com" }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // fondo limpio
  },
  logo: {
    width: 150,
    height: 150,
  },
  splashText: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "600",
    color: "#222",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    color: "red",
  },
});
