import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import Footer from '../components/Layout/Footer';

const { width, height } = Dimensions.get('window');

interface ScannedItem {
  _id: string;
  name: string;
  brandName: string;
  quantity: number;
  sellingPrice: number;
  isActive: boolean;
  isLowStock: boolean;
}

const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    try {
      // Search for item by barcode
      const response = await axios.get(`${API_BASE_URL}/api/inventory/barcode/${data}`);
      
      if (response.data.success) {
        setScannedItem(response.data.data);
        setSnackbarMessage('Item found successfully!');
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage('Item not found in inventory');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error searching for item:', error);
      setSnackbarMessage('Error searching for item');
      setSnackbarVisible(true);
    }
  };

  const handleAddToCart = () => {
    if (scannedItem) {
      // Navigate to sales screen with scanned item
      navigation.navigate('Sales', { 
        scannedItem: {
          drug: scannedItem._id,
          quantity: 1
        }
      });
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedItem(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Camera Permission Required</Title>
            <Paragraph>
              This feature requires camera access to scan barcodes and QR codes.
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pharmacyName}>JELPAPHARM</Text>
        <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
        <Text style={styles.headerTitle}>Barcode Scanner</Text>
      </View>
      
      {!scanned ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>
              Position barcode/QR code within the frame
            </Text>
          </View>
          <View style={styles.controls}>
            <IconButton
              icon="arrow-left"
              size={30}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {scannedItem ? (
            <Card style={styles.card}>
              <Card.Content>
                <Title>Item Found</Title>
                <Paragraph style={styles.itemName}>{scannedItem.name}</Paragraph>
                <Paragraph style={styles.itemBrand}>{scannedItem.brandName}</Paragraph>
                <View style={styles.itemDetails}>
                  <Text style={styles.detailText}>
                    Price: GH₵ {scannedItem.sellingPrice.toFixed(2)}
                  </Text>
                  <Text style={styles.detailText}>
                    Stock: {scannedItem.quantity} units
                  </Text>
                  {scannedItem.isLowStock && (
                    <Text style={styles.lowStockText}>⚠️ Low Stock</Text>
                  )}
                </View>
                <View style={styles.buttonContainer}>
                  <Button 
                    mode="contained" 
                    onPress={handleAddToCart}
                    style={styles.button}
                    disabled={!scannedItem.isActive || scannedItem.quantity === 0}
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={handleScanAgain}
                    style={styles.button}
                  >
                    Scan Again
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Card.Content>
                <Title>Item Not Found</Title>
                <Paragraph>
                  The scanned barcode/QR code was not found in the inventory.
                </Paragraph>
                <Button 
                  mode="contained" 
                  onPress={handleScanAgain}
                  style={styles.button}
                >
                  Try Again
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      <Footer 
        customText="Barcode scanner for quick inventory lookup"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.medium,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  pharmacyName: {
    ...typography.h4,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  pharmacySubtitle: {
    ...typography.body1,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h5,
    color: theme.colors.text,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  resultContainer: {
    flex: 1,
    padding: spacing.medium,
    justifyContent: 'center',
  },
  card: {
    marginBottom: spacing.medium,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemBrand: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: 15,
  },
  itemDetails: {
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
  },
  lowStockText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  snackbar: {
    backgroundColor: theme.colors.primary,
  },
});

export default BarcodeScannerScreen;
