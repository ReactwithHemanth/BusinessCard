import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {Button} from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextRecognition from 'react-native-text-recognition';

const BusinessCardScannerScreen = ({navigation, route}) => {
  const {isAdmin = false} = route.params || {};
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanMode, setScanMode] = useState('card'); // 'card' or 'qr'
  const [capturedItems, setCapturedItems] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(isAdmin);

  const cameraRef = useRef(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      console.log(`Scanned ${codes.length} codes!`);
    },
  });
  useEffect(() => {
    const getPermissions = async () => {
      if (!hasPermission) {
        const permission = await requestPermission();
        if (!permission) {
          Alert.alert('Permission Denied', 'Camera access is required.');
        }
      }
    };
    getPermissions();
    loadCapturedItems();
  }, [hasPermission]);

  // Process QR codes when detected
  useEffect(() => {
    if (barcodes.length > 0 && scanMode === 'qr' && !processing) {
      processBarcodeResult(barcodes[0]);
    }
  }, [barcodes, scanMode]);

  const loadCapturedItems = async () => {
    try {
      const savedItems = await AsyncStorage.getItem('capturedItems');
      if (savedItems) {
        setCapturedItems(JSON.parse(savedItems));
      }
    } catch (error) {
      console.error('Failed to load saved items:', error);
    }
  };

  const saveCapturedItem = async newItem => {
    try {
      const updatedItems = [...capturedItems, newItem];
      await AsyncStorage.setItem('capturedItems', JSON.stringify(updatedItems));
      setCapturedItems(updatedItems);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || !hasPermission || !device) return;

    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePhoto();
      if (scanMode === 'card') {
        processBusinessCard(photo.path);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      setProcessing(false);
    }
  };

  const processBusinessCard = async imageUri => {
    setProcessing(true);
    try {
      const recognizedText = await TextRecognition.recognize(imageUri);

      // Extract structured details from text (Name, Email, Phone, etc.)
      const extractedData = parseBusinessCardText(recognizedText);

      const newCard = {
        id: Date.now().toString(),
        type: 'card',
        imageUri,
        timestamp: new Date().toISOString(),
        data: extractedData,
      };

      saveCapturedItem(newCard);
      setProcessing(false);
      Alert.alert('Success', 'Business card details extracted and saved!');
    } catch (error) {
      console.error('OCR Error:', error);
      setProcessing(false);
      Alert.alert('Error', 'Failed to extract text from business card.');
    }
  };

  const parseBusinessCardText = text => {
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

    return {
      name: text.split('\n')[0] || 'Unknown Name', // First line as name assumption
      company: text.split('\n')[1] || 'Unknown Company', // Second line as company assumption
      phone: text.match(phoneRegex)?.[0] || 'Not Found',
      email: text.match(emailRegex)?.[0] || 'Not Found',
    };
  };

  const processBarcodeResult = barcode => {
    if (processing) return;
    setProcessing(true);

    // Process the QR code data
    const newQrCode = {
      id: Date.now().toString(),
      type: 'qr',
      timestamp: new Date().toISOString(),
      data: {
        value: barcode.displayValue,
        format: barcode.format,
      },
    };

    saveCapturedItem(newQrCode);
    setProcessing(false);
    Alert.alert('Success', 'QR Code scanned and saved!');
    setScanning(false);
  };

  const renderBusinessCardItem = ({item}) => {
    const {data} = item;
    return (
      <TouchableOpacity
        style={styles.expandedItemCard}
        onPress={() => setViewingItem(item)}>
        <View style={styles.itemHeader}>
          <Image source={{uri: item.imageUri}} style={styles.itemThumbnail} />
          <View style={styles.itemHeaderInfo}>
            <Text style={styles.itemTitle}>Business Card</Text>
            <Text style={styles.itemDate}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setViewingItem(item)}>
            <Ionicons name="expand-outline" size={20} color="#4B0082" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDetailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={16} color="#4B0082" />
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailText}>{data.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="business-outline" size={16} color="#4B0082" />
              <Text style={styles.detailLabel}>Company:</Text>
              <Text style={styles.detailText}>{data.company}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={16} color="#4B0082" />
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailText}>{data.phone}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={16} color="#4B0082" />
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailText}>{data.email}</Text>
            </View>
          </View>

          {data.position && (
            <View style={styles.fullWidthDetail}>
              <Ionicons name="briefcase-outline" size={16} color="#4B0082" />
              <Text style={styles.detailLabel}>Position:</Text>
              <Text style={styles.detailText}>{data.position}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderQRCodeItem = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.expandedItemCard}
        onPress={() => setViewingItem(item)}>
        <View style={styles.itemHeader}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={40} color="#4B0082" />
          </View>
          <View style={styles.itemHeaderInfo}>
            <Text style={styles.itemTitle}>QR Code</Text>
            <Text style={styles.itemDate}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setViewingItem(item)}>
            <Ionicons name="expand-outline" size={20} color="#4B0082" />
          </TouchableOpacity>
        </View>

        <View style={styles.qrDetailsContainer}>
          <View style={styles.qrValueContainer}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#4B0082"
            />
            <Text style={styles.qrValueLabel}>Value:</Text>
            <Text style={styles.qrValueText} numberOfLines={2}>
              {item.data.value}
            </Text>
          </View>

          <View style={styles.qrFormat}>
            <Ionicons name="code-outline" size={16} color="#4B0082" />
            <Text style={styles.detailLabel}>Format:</Text>
            <Text style={styles.detailText}>{item.data.format}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCapturedItem = ({item}) => {
    return item.type === 'card'
      ? renderBusinessCardItem({item})
      : renderQRCodeItem({item});
  };

  const renderItemDetails = () => {
    if (!viewingItem) return null;

    return (
      <Modal visible={!!viewingItem} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setViewingItem(null)}>
              <Ionicons name="close" size={24} color="#4B0082" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {viewingItem.type === 'card'
                ? 'Business Card Details'
                : 'QR Code Data'}
            </Text>

            {viewingItem.type === 'card' && viewingItem.imageUri && (
              <Image
                source={{uri: viewingItem.imageUri}}
                style={styles.fullCardImage}
                resizeMode="contain"
              />
            )}

            {viewingItem.type === 'card' ? (
              <View style={styles.detailsContainer}>
                {Object.entries(viewingItem.data).map(([key, value]) => (
                  <View key={key} style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>
                    <Text style={styles.modalDetailValue}>{value}</Text>
                  </View>
                ))}

                <Text style={styles.scanTimeLabel}>Scanned on:</Text>
                <Text style={styles.scanTimeValue}>
                  {new Date(viewingItem.timestamp).toLocaleString()}
                </Text>
              </View>
            ) : (
              <View style={styles.detailsContainer}>
                <Text style={styles.modalDetailLabel}>QR Code Value:</Text>
                <Text style={styles.qrLongValue}>{viewingItem.data.value}</Text>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Format:</Text>
                  <Text style={styles.modalDetailValue}>
                    {viewingItem.data.format}
                  </Text>
                </View>

                <Text style={styles.scanTimeLabel}>Scanned on:</Text>
                <Text style={styles.scanTimeValue}>
                  {new Date(viewingItem.timestamp).toLocaleString()}
                </Text>
              </View>
            )}

            <Button
              title="Close"
              buttonStyle={styles.closeButton}
              onPress={() => setViewingItem(null)}
            />
          </View>
        </View>
      </Modal>
    );
  };

  if (!device && scanning) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No Camera Device Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            codeScanner={codeScanner}
            isActive={true}
            photo={true}
            frameProcessor={scanMode === 'qr' ? frameProcessor : undefined}
            frameProcessorFps={5}
          />

          <View style={styles.scanModeToggle}>
            <TouchableOpacity
              style={[
                styles.modeSelectorButton,
                scanMode === 'card' && styles.activeMode,
              ]}
              onPress={() => setScanMode('card')}>
              <Ionicons
                name="card"
                size={20}
                color={scanMode === 'card' ? '#fff' : '#4B0082'}
              />
              <Text
                style={
                  scanMode === 'card' ? styles.activeModeText : styles.modeText
                }>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeSelectorButton,
                scanMode === 'qr' && styles.activeMode,
              ]}
              onPress={() => setScanMode('qr')}>
              <Ionicons
                name="qr-code"
                size={20}
                color={scanMode === 'qr' ? '#fff' : '#4B0082'}
              />
              <Text
                style={
                  scanMode === 'qr' ? styles.activeModeText : styles.modeText
                }>
                QR
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraControls}>
            {processing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              scanMode === 'card' && (
                <TouchableOpacity
                  onPress={takePicture}
                  style={styles.captureBtn}>
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setScanning(false)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>

          {scanMode === 'qr' && (
            <View style={styles.scanFrame}>
              <View style={styles.scanCorner1} />
              <View style={styles.scanCorner2} />
              <View style={styles.scanCorner3} />
              <View style={styles.scanCorner4} />
            </View>
          )}
        </View>
      ) : showAdminPanel ? (
        <View style={styles.adminPanel}>
          <View style={styles.adminHeader}>
            <Text style={styles.adminTitle}>Captured Items</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setScanning(true)}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          {capturedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No items captured yet</Text>
              <Button
                title="Scan New Item"
                buttonStyle={styles.startButton}
                onPress={() => setScanning(true)}
              />
            </View>
          ) : (
            <FlatList
              data={capturedItems}
              keyExtractor={item => item.id}
              renderItem={renderCapturedItem}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <Ionicons
            name="scan-outline"
            size={80}
            color="#4B0082"
            style={styles.cardIcon}
          />
          <Text style={styles.title}>Multi-Purpose Scanner</Text>
          <Text style={styles.instructions}>
            Scan business cards or QR codes with ease. Our scanner extracts
            information automatically.
          </Text>
          <Button
            title="Open Scanner"
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

          {isAdmin && (
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => setShowAdminPanel(true)}>
              <Ionicons name="list" size={20} color="#4B0082" />
              <Text style={styles.adminLinkText}>View Captured Items</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {renderItemDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardIcon: {marginBottom: 20},
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
  cameraContainer: {flex: 1},
  camera: {flex: 1},
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
  scanModeToggle: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 5,
  },
  modeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeMode: {
    backgroundColor: '#4B0082',
  },
  modeText: {
    marginLeft: 5,
    color: '#4B0082',
    fontWeight: '600',
  },
  activeModeText: {
    marginLeft: 5,
    color: '#fff',
    fontWeight: '600',
  },
  scanFrame: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    width: '70%',
    height: '40%',
  },
  scanCorner1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 5,
    borderTopWidth: 5,
    borderColor: '#fff',
  },
  scanCorner2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderColor: '#fff',
  },
  scanCorner3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#fff',
  },
  scanCorner4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 18,
    color: 'red',
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  adminLinkText: {
    marginLeft: 8,
    color: '#4B0082',
    fontWeight: '600',
    fontSize: 16,
  },
  adminPanel: {
    flex: 1,
    padding: 15,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B0082',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  expandedItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  itemHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  qrPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  viewButton: {
    padding: 8,
  },
  cardDetailsContainer: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  fullWidthDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrDetailsContainer: {
    padding: 12,
  },
  qrValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  qrValueLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 4,
  },
  qrValueText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  qrFormat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 15,
    textAlign: 'center',
  },
  fullCardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailsContainer: {
    marginTop: 10,
  },
  modalDetailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  modalDetailLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
    width: 100,
  },
  modalDetailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  qrLongValue: {
    fontSize: 15,
    color: '#333',
    marginBottom: 15,
  },
  scanTimeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginTop: 10,
  },
  scanTimeValue: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#4B0082',
    paddingVertical: 12,
    marginTop: 15,
    borderRadius: 8,
  },
});

export default BusinessCardScannerScreen;
