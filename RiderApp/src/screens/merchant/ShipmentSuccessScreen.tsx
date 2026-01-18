import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Clipboard,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { colors, typography, spacing, borderRadius } from '../../theme';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

export default function ShipmentSuccessScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { trackingNumber, shipmentType } = route.params || {};
  const qrCodeRef = useRef<any>(null);

  const shipmentTypeText = shipmentType === 'franchise' ? 'franchise' : 'individual';

  const handleCopyTrackingNumber = () => {
    if (trackingNumber) {
      Clipboard.setString(trackingNumber);
      Alert.alert('Copied', 'Tracking number copied to clipboard!');
    }
  };

  const handleDownloadQRCode = async () => {
    try {
      if (!qrCodeRef.current) {
        Alert.alert('Error', 'QR code not available');
        return;
      }

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant storage permission to download QR code.');
        return;
      }

      // Capture QR code as image
      const uri = await captureRef(qrCodeRef.current, {
        format: 'png',
        quality: 1,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Success', 'QR code downloaded to your gallery!');
    } catch (error: any) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to download QR code. Please try again.');
    }
  };

  const handlePrintLabel = () => {
    // For now, show an alert. In production, integrate with a printing service
    Alert.alert(
      'Print Label',
      'Print functionality will be available soon. You can download the QR code and print it manually.',
      [
        {
          text: 'Download QR Code Instead',
          onPress: handleDownloadQRCode,
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  };

  const handleShareTracking = async () => {
    try {
      if (trackingNumber) {
        await Share.share({
          message: `Track your shipment: ${trackingNumber}\nUse this tracking number to track your package.`,
          title: 'Shipment Tracking Number',
        });
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
    }
  };

  const handleBackToHome = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('MerchantApp', { screen: 'Home' });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MerchantApp' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Green Success Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30) }]}>
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={colors.success} />
          </View>
        </View>
        <Text style={styles.successTitle}>Shipment Created!</Text>
        <Text style={styles.successSubtitle}>
          Your {shipmentTypeText} shipment has been created successfully
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main White Card */}
        <View style={styles.mainCard}>
          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Scan QR Code to Track</Text>
            <View style={styles.qrCodeContainer} ref={qrCodeRef} collapsable={false}>
              <QRCode
                value={trackingNumber || 'CE2025-IND-173414372'}
                size={200}
                color={colors.text}
                backgroundColor={colors.background}
              />
            </View>

            {/* Tracking Number Box */}
            <View style={styles.trackingBox}>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingNumber}>{trackingNumber || 'CE2025-IND-173414372'}</Text>
            </View>

            {/* Copy Tracking Number Button */}
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyTrackingNumber}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
              <Text style={styles.copyButtonText}>Copy Tracking Number</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadQRCode}>
              <Ionicons name="download-outline" size={24} color={colors.textWhite} />
              <Text style={styles.actionButtonText}>Download QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.printButton]} onPress={handlePrintLabel}>
              <Ionicons name="print-outline" size={24} color={colors.textWhite} />
              <Text style={styles.actionButtonText}>Print Label</Text>
            </TouchableOpacity>
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsSection}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>1.</Text>
                <Text style={styles.stepText}>Print or save this QR code for easy tracking</Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>2.</Text>
                <Text style={styles.stepText}>Share tracking number with your customer</Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>3.</Text>
                <Text style={styles.stepText}>Our rider will contact you for pickup soon</Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>4.</Text>
                <Text style={styles.stepText}>Track shipment progress in real-time</Text>
              </View>
            </View>
          </View>

          {/* Important Information */}
          <View style={styles.importantBox}>
            <View style={styles.importantHeader}>
              <Ionicons name="cube-outline" size={20} color={colors.text} />
              <Text style={styles.importantTitle}>Important:</Text>
            </View>
            <Text style={styles.importantText}>
              Keep your QR code safe. Riders will scan this code during pickup, hub processing, and delivery.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Back to Home Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <Ionicons name="home-outline" size={24} color={colors.textWhite} />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  mainCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  qrTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  qrCodeContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  trackingBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  trackingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  trackingNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    gap: spacing.xs,
  },
  copyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  printButton: {
    backgroundColor: colors.textLight,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textWhite,
  },
  nextStepsSection: {
    marginBottom: spacing.xl,
  },
  stepsList: {
    gap: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    minWidth: 20,
  },
  stepText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  importantBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FDD835',
  },
  importantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  importantTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  importantText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 50,
  },
  homeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
});

