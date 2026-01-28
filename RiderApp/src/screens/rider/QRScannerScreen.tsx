import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QRScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, order, scanType = 'pickup' } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
        requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    // Vibrate or sound could be good here
    
    // Validate against tracking number
    const expected = order?.trackingNumber || order?.tracking_number;
    // Allow basic fuzzy match or exact match. Usually exact.
    // If scanning a generated QR that contains just the ID, check that too.
    if (expected && data !== expected && !data.includes(expected)) {
         Alert.alert('Scan Mismatch', `Scanned: ${data}\nExpected: ${expected}`);
         setScanned(false); // allow rescan
         return;
    }

    // Navigate to Confirmation with the scanned code
    const targetScreen = scanType === 'delivery' ? 'DeliveryConfirmation' : 'PickupConfirmation';
    navigation.replace(targetScreen, {
        orderId,
        order,
        scannedCode: data
    });
  };

  if (!permission) {
    // Permission loading state
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Permission Denied UI (Matching Image 2)
    return (
      <View style={styles.deniedContainer}>
         <View style={[styles.header, { marginTop: insets.top }]}>
             <TouchableOpacity onPress={() => navigation.goBack()}>
                 <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Camera Access</Text>
         </View>
         
         <View style={styles.deniedContent}>
             <View style={styles.deniedIconCircle}>
                 <Ionicons name="close" size={40} color="#FF5252" />
             </View>
             
             <Text style={styles.deniedTitle}>Camera Access Denied</Text>
             <Text style={styles.deniedText}>
               Please enable camera permissions in your browser settings to scan QR codes.
             </Text>

             <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
                 <Text style={styles.retryButtonText}>Retry Camera Access</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.secondaryButton} onPress={() => {
                 // Manual entry fallback
                 const targetScreen = scanType === 'delivery' ? 'DeliveryConfirmation' : 'PickupConfirmation';
                 navigation.replace(targetScreen, { orderId, order, manualEntry: true });
             }}>
                 <Text style={styles.secondaryButtonText}>Enter Manually Instead</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                 <Text style={styles.secondaryButtonText}>Go Back</Text>
             </TouchableOpacity>
         </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
         <View style={styles.headerOverlay}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonRound}>
                 <Ionicons name="close" size={24} color="#FFF" />
             </TouchableOpacity>
             <Text style={styles.scanText}>{scanType === 'delivery' ? 'Scan Delivery QR' : 'Scan Pickup QR'}</Text>
         </View>

         <View style={styles.scannerFrame}>
             <View style={styles.cornerTL} />
             <View style={styles.cornerTR} />
             <View style={styles.cornerBL} />
             <View style={styles.cornerBR} />
         </View>

         <Text style={styles.instructionText}> Align code within frame </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  deniedContainer: {
      flex: 1,
      backgroundColor: '#0F172A', // Dark Navy/Black from image
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: '#FF6B00', // Orange from image
      gap: spacing.md,
  },
  headerTitle: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '500',
  },
  deniedContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
  },
  deniedIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 82, 82, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
  },
  deniedTitle: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing.md,
  },
  deniedText: {
      color: '#94A3B8',
      textAlign: 'center',
      marginBottom: spacing['2xl'],
      lineHeight: 22,
  },
  retryButton: {
      width: '100%',
      backgroundColor: '#FF6B00',
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
  },
  retryButtonText: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 16,
  },
  secondaryButton: {
      width: '100%',
      backgroundColor: '#1E293B', // Darker gray/blue
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
  },
  secondaryButtonText: {
      color: '#E2E8F0',
      fontWeight: '500',
      fontSize: 16,
  },
  // Camera Overlay Styles
  overlay: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerOverlay: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: spacing.xl,
      marginBottom: 100,
  },
  backButtonRound: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.lg,
  },
  scanText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '600',
  },
  scannerFrame: {
      width: 250,
      height: 250,
      borderColor: 'transparent', // We draw corners manually
      position: 'relative',
      marginBottom: spacing.xl,
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#FF6B00' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#FF6B00' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#FF6B00' },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#FF6B00' },
  instructionText: {
      color: '#FFF',
      marginTop: spacing.lg,
      fontSize: 14,
      opacity: 0.8,
  }
});
