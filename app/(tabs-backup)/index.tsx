import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';

export default function TrigguiScreen() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  // 🔄 Loader
  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);

  // 💬 Estado para frases al hacer clic en bloques
  const [activeMessage, setActiveMessage] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Animated.Image
          source={require('../../assets/imagotipo.png')}
          style={[styles.loaderImage, { opacity: fadeAnim }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.loaderText, { opacity: fadeAnim }]}>
          Cargando Triggui...
        </Animated.Text>
      </View>
    );
  }

  // 🎨 Nuevos colores armónicos y energéticos
  const blocks = [
    {
      label: 'Detente',
      color: '#B388EB', // lila
      message: '✖ Detén el ruido. ✖ Respira. ✖ Ábrete a lo esencial.',
    },
    {
      label: 'Lee',
      color: '#FF9B71', // naranja coral
      message: '📘 Un solo párrafo puede cambiar tu día.',
    },
    {
      label: '?',
      color: '#70D6FF', // azul celeste
      message: '🌀 ¿Y si este fuera el momento exacto para abrir ese libro?',
    },
    {
      label: 'Conecta',
      color: '#FFD670', // amarillo calidez
      message: '🤝 Conecta contigo antes de volver a conectar con el mundo.',
    },
  ];

  const blockWidth = isMobile ? width * 0.45 : width * 0.22;
  const blockHeight = isMobile ? height * 0.35 : height * 0.6;
  const spacing = isMobile ? 6 : 20;

  return (
    <View style={styles.container}>
      {/* 🧩 Cuadrícula de 4 bloques */}
      <View
        style={[
          styles.grid,
          {
            flexDirection: isMobile ? 'row' : 'row',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingHorizontal: isMobile ? 4 : 20,
            paddingTop: isMobile ? 8 : 30,
          },
        ]}
      >
        {blocks.map((block, i) => (
          <TouchableOpacity
            key={i}
            style={{
              width: blockWidth,
              height: blockHeight,
              backgroundColor: block.color,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              margin: spacing / 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 4,
            }}
            onPress={() => setActiveMessage(block.message)}
          >
            <Text style={styles.blockText}>{block.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ✨ Frase activa al presionar un botón */}
      {activeMessage !== '' && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{activeMessage}</Text>
        </View>
      )}

      {/* 🔗 Logo inferior */}
      <View style={styles.logoWrapper}>
        <Image
          source={require('../../assets/imagotipo.png')}
          style={styles.imagotipo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>triggui</Text>
        <Text style={styles.tagline}>
          Concentración Absoluta. Herramienta práctica para vencer la distracción y vivir con alegría y propósito.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  blockText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '600',
  },
  messageContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 20 : 30,
  },
  imagotipo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
    color: '#444',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  loaderImage: {
    width: 60,
    height: 60,
  },
});
