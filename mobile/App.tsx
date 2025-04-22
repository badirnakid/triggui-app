import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.bookContainer}>
        <Image
          source={{ uri: 'https://is1-ssl.mzstatic.com/image/thumb/Publication71/v4/37/ae/8f/37ae8f8e-f4d9-2ea2-b550-093804c0e8a3/9781351817677.jpg/626x0w.jpg' }}
          style={styles.bookImage}
        />
      </View>
      <Text style={styles.phrase}>
        “TrigguiApp: en la nube funcionando” — Confucio
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>📖</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Si no sacamos tiempo</Text>
            <Text style={styles.modalText}>
              en el momento para hacer lo que realmente importa, estaremos abriendo las puertas a la COMPLEJIDAD y total desenfoque.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 20,
  },
  bookContainer: {
    width: 200,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
  },
  bookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  phrase: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: '#87CEEB',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 32,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
  },
  closeText: {
    fontSize: 22,
    color: '#444',
  },
});
