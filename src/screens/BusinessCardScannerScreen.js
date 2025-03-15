import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Button} from 'react-native-elements';
import {RNCamera} from 'react-native-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BusinessCardScannerScreen = ({navigation}) => {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      setProcessing(true);
      try {
        const options = {quality: 0.8, base64: true};
        const data = await cameraRef.current.takePictureAsync(options);

        // In a real app, you would send this image to an OCR service
        // For now, we'll simulate processing
        simulateCardProcessing(data.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        setProcessing(false);
      }
    }
  };

  const simulateCardProcessing = imageUri => {
    // Simulate OCR processing delay
    setTimeout(() => {
      setProcessing(false);
      navigation.navigate('Home');
      Alert.alert('Success', 'Business card scanned and contact saved!', [
        {text: 'OK'},
      ]);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.cameraContainer}>
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}>
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
            </View>
            <View style={styles.cameraControls}>
              {processing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <TouchableOpacity
                  onPress={takePicture}
                  style={styles.captureBtn}>
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>
              )}
            </View>
          </RNCamera>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setScanning(false)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <Ionicons
            name="card"
            size={80}
            color="#4B0082"
            style={styles.cardIcon}
          />
          <Text style={styles.title}>Business Card Scanner</Text>
          <Text style={styles.instructions}>
            Position the business card within the frame and take a clear photo.
            We'll extract the contact information automatically.
          </Text>
          <Button
            title="Open Camera"
            buttonStyle={styles.startButton}
            icon={
              <Ionicons
                name="camera"
                size={20}
                color="white"
                style={{marginRight: 10}}
              />
            }
            onPress={() => setScanning(true)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 300,
    height: 180,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});

export default BusinessCardScannerScreen;
