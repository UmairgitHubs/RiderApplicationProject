import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useCreateShipment } from '../../hooks/useShipments';
import FranchiseShipmentScreen from './FranchiseShipmentScreen';
import IndividualShipmentScreen from './IndividualShipmentScreen';

interface Package {
  id: string;
  packageType: string;
  packageWeight: string;
  packageValue: string;
  packageSize: 'small' | 'medium' | 'large';
  description: string;
}

export default function CreateShipmentScreen({ navigation, route }: any) {
  const shipmentType = route?.params?.shipmentType;
  const { mutateAsync: createShipment, isPending: isCreating } = useCreateShipment();
  
  // If franchise type, render franchise screen
  if (shipmentType === 'franchise') {
    return <FranchiseShipmentScreen navigation={navigation} route={route} />;
  }
  
  // If individual type, render individual screen
  if (shipmentType === 'individual') {
    return <IndividualShipmentScreen navigation={navigation} route={route} />;
  }
  
  // Otherwise, render default individual shipment form
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      packageType: '',
      packageWeight: '',
      packageValue: '',
      packageSize: 'medium',
      description: '',
    },
  ]);


  const addPackage = () => {
    setPackages([
      ...packages,
      {
        id: Date.now().toString(),
        packageType: '',
        packageWeight: '',
        packageValue: '',
        packageSize: 'medium',
        description: '',
      },
    ]);
  };

  const removePackage = (id: string) => {
    if (packages.length > 1) {
      setPackages(packages.filter((pkg) => pkg.id !== id));
    } else {
      Alert.alert('Cannot Remove', 'At least one package is required.');
    }
  };

  const updatePackage = (id: string, field: keyof Package, value: any) => {
    setPackages(
      packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg))
    );
  };

  const handleCreateShipment = async () => {
    // Validate
    if (!recipientName || !recipientPhone || !pickupAddress || !deliveryAddress) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (packages.some((pkg) => !pkg.packageType)) {
      Alert.alert('Missing Information', 'Please specify package type for all packages.');
      return;
    }

    try {
      const shipmentData = {
        recipientName,
        recipientPhone,
        pickupAddress,
        deliveryAddress,
        packages: packages.map((pkg) => ({
          packageType: pkg.packageType,
          packageWeight: pkg.packageWeight || undefined,
          packageValue: pkg.packageValue || undefined,
          packageSize: pkg.packageSize,
          description: pkg.description || undefined,
        })),
        specialInstructions: specialInstructions || undefined,
      };

      console.log('Creating shipment with data:', JSON.stringify(shipmentData, null, 2));

      await createShipment(shipmentData);

      Alert.alert(
        'Success',
        `Shipment created successfully with ${packages.length} package(s)!`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Refresh shipments list handled by query invalidation
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create shipment. Please check your connection and try again.'
      );
    }
  };

  const renderPackage = (pkg: Package, index: number) => {
    const isMultiple = packages.length > 1;
    
    return (
      <View key={pkg.id} style={styles.packageCard}>
        {isMultiple && (
          <View style={styles.packageHeader}>
            <Text style={styles.packageNumber}>Package {index + 1}</Text>
            <TouchableOpacity
              onPress={() => removePackage(pkg.id)}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Item Type *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="cube-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Electronics, Documents, Clothing, etc."
            placeholderTextColor={colors.textLight}
            value={pkg.packageType}
            onChangeText={(value) => updatePackage(pkg.id, 'packageType', value)}
          />
        </View>

        <Text style={styles.label}>Package Size *</Text>
        <View style={styles.sizeContainer}>
          <TouchableOpacity
            style={[
              styles.sizeButton,
              pkg.packageSize === 'small' && styles.sizeButtonActive,
            ]}
            onPress={() => updatePackage(pkg.id, 'packageSize', 'small')}
          >
            <Ionicons 
              name="cube-outline" 
              size={24} 
              color={pkg.packageSize === 'small' ? colors.textWhite : colors.textLight} 
            />
            <Text style={[
              styles.sizeText,
              pkg.packageSize === 'small' && styles.sizeTextActive,
            ]}>
              Small
            </Text>
            <Text style={[
              styles.sizeSubtext,
              pkg.packageSize === 'small' && styles.sizeSubtextActive,
            ]}>
              Up to 2kg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sizeButton,
              pkg.packageSize === 'medium' && styles.sizeButtonActive,
            ]}
            onPress={() => updatePackage(pkg.id, 'packageSize', 'medium')}
          >
            <Ionicons 
              name="cube" 
              size={28} 
              color={pkg.packageSize === 'medium' ? colors.textWhite : colors.textLight} 
            />
            <Text style={[
              styles.sizeText,
              pkg.packageSize === 'medium' && styles.sizeTextActive,
            ]}>
              Medium
            </Text>
            <Text style={[
              styles.sizeSubtext,
              pkg.packageSize === 'medium' && styles.sizeSubtextActive,
            ]}>
              Up to 5kg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sizeButton,
              pkg.packageSize === 'large' && styles.sizeButtonActive,
            ]}
            onPress={() => updatePackage(pkg.id, 'packageSize', 'large')}
          >
            <Ionicons 
              name="cube" 
              size={32} 
              color={pkg.packageSize === 'large' ? colors.textWhite : colors.textLight} 
            />
            <Text style={[
              styles.sizeText,
              pkg.packageSize === 'large' && styles.sizeTextActive,
            ]}>
              Large
            </Text>
            <Text style={[
              styles.sizeSubtext,
              pkg.packageSize === 'large' && styles.sizeSubtextActive,
            ]}>
              Up to 10kg
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Weight (kg)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="scale-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="2.5"
            placeholderTextColor={colors.textLight}
            value={pkg.packageWeight}
            onChangeText={(value) => updatePackage(pkg.id, 'packageWeight', value)}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.label}>Declared Value ($)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="cash-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="100.00"
            placeholderTextColor={colors.textLight}
            value={pkg.packageValue}
            onChangeText={(value) => updatePackage(pkg.id, 'packageValue', value)}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.label}>Description (Optional)</Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Package description..."
            placeholderTextColor={colors.textLight}
            value={pkg.description}
            onChangeText={(value) => updatePackage(pkg.id, 'description', value)}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header */}
      <View style={styles.orangeHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Create New Shipment</Text>
          <Text style={styles.subtitle}>Book a new delivery</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>
          
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={colors.textLight}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>

          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textLight}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Pickup & Delivery Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          
          <Text style={styles.label}>Pickup Address *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color={colors.success} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="123 Main St, Manhattan, NY 10001"
              placeholderTextColor={colors.textLight}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
            />
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate('MapSelection', {
                    title: 'Select Pickup Location',
                    onLocationSelect: (location: any) => {
                      setPickupAddress(`${location.latitude}, ${location.longitude}`);
                    },
                  });
                }
              }}
            >
              <Ionicons name="map-outline" size={20} color={colors.success} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Delivery Address *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color={colors.error} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="456 Park Ave, Brooklyn, NY 11201"
              placeholderTextColor={colors.textLight}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate('MapSelection', {
                    title: 'Select Delivery Location',
                    onLocationSelect: (location: any) => {
                      setDeliveryAddress(`${location.latitude}, ${location.longitude}`);
                    },
                  });
                }
              }}
            >
              <Ionicons name="map-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Packages Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Packages ({packages.length})</Text>
            <TouchableOpacity
              style={styles.addPackageButton}
              onPress={addPackage}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={styles.addPackageText}>Add Package</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Each package will get its own barcode for individual tracking
          </Text>

          {packages.map((pkg, index) => renderPackage(pkg, index))}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any special delivery instructions..."
              placeholderTextColor={colors.textLight}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Delivery Fee Estimate */}
        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Base Fee</Text>
            <Text style={styles.feeValue}>PKR 100</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Package Count</Text>
            <Text style={styles.feeValue}>{packages.length} package(s)</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabelTotal}>Estimated Total</Text>
            <Text style={styles.feeTotalValue}>PKR {100 + (packages.length * 10)}</Text>
          </View>
        </View>

        {/* Create Shipment Button */}
        <TouchableOpacity 
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateShipment}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
          )}
          <Text style={styles.createButtonText}>
            {isCreating ? 'Creating...' : 'Create Shipment'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 160,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginTop: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  mapButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  packageCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  packageNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  removeButton: {
    padding: spacing.xs,
  },
  addPackageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  addPackageText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sizeButton: {
    flex: 1,
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sizeTextActive: {
    color: colors.textWhite,
  },
  sizeSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  sizeSubtextActive: {
    color: colors.textWhite,
    opacity: 0.9,
  },
  feeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  feeLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  feeValue: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  feeLabelTotal: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  feeTotalValue: {
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  feeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
});
