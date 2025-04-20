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

export default function Home() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Animated.Image
          source={require('../assets/imagotipo.png')}
          style={[styles.loaderImage, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  const blocks = [
    { label: 'Detente', gradient: ['#E96443', '#904E95'] },
    { label: 'Lee', gradient: ['#2193b0', '#6dd5ed'] },
    { label: '?', gradient: ['#ff6e7f', '#bfe9ff'] },
    { label: 'Conecta', gradient: ['#00c3ff', '#ffff1c'] },
  ];

  const blockWidth = isMobile ? width * 0.44 : width * 0.22;
  const blockHeight = isMobile ? height * 0.34 : height * 0.6;
  const spacing = isMobile ? 4 : 16;

  return (
    <View style={styles.container}>
      <View style={[styles.grid, {
        flexDirection: 'row',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        paddingHorizontal: isMobile ? 4 : 24,
        paddingTop: isMobile ? 8 : 32,
        gap: spacing,
      }]}>
        {blocks.map((block, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            style={{
              width: blockWidth,
              height: blockHeight,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: block.gradient[0],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => {}}
          >
            <Text style={styles.blockText}>{block.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.shockButton}
        onPress={() => setShowFeedback(true)}
      >
        <Text style={styles.shockText}>
          {showFeedback ? '📚 ¡Gracias por abrir un libro físico!' : '📚 Chócalas aquí si abriste un libro físico'}
        </Text>
      </TouchableOpacity>

      <View style={styles.logoWrapper}>
        <Image source={require('../assets/imagotipo.png')} style={styles.imagotipo} resizeMode="contain" />
        <Image source={require('../assets/trigguiletras.jpg')} style={styles.trigguiletras} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  shockButton: {
    backgroundColor: '#6200EA',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 32,
    alignSelf: 'center',
    marginTop: 12,
    shadowColor: '#6200EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  shockText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  imagotipo: {
    width: 42,
    height: 42,
    marginRight: 8,
  },
  trigguiletras: {
    width: 100,
    height: 28,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderImage: {
    width: 80,
    height: 80,
  },
});
