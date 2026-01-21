import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { shipmentApi, api, authApi } from '../../services/api';

export default function IndividualShipmentScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageType, setPackageType] = useState('');
  const [showPackageTypeModal, setShowPackageTypeModal] = useState(false);
  const [weight, setWeight] = useState('0.0');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [codAmount, setCodAmount] = useState('0.00');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPickup, setLoadingPickup] = useState(true);
  const [pickupCity, setPickupCity] = useState('');
  const [isEditingPickup, setIsEditingPickup] = useState(false);

  const packageTypes = [
    'Electronics',
    'Clothing',
    'Documents',
    'Food',
    'Fragile',
    'Other',
  ];

  // Pickup address state
  const [pickupAddress, setPickupAddress] = useState({
    label: 'Your Location',
    phone: '',
    address: 'Current registered address',
  });

  // Fetch user profile and default address on mount
  useEffect(() => {
    fetchPickupAddress();
  }, []);

  const handleEditPickup = () => setIsEditingPickup(true);

  const handleSavePickup = () => {
      // Basic validation if needed
      if(!pickupCity.trim()) {
          Alert.alert("Validation Error", "Pickup City is required");
          return;
      }
      setIsEditingPickup(false);
  }

  // Effect to ensure we default to "Your Location" label if empty
  useEffect(() => {
     if(!pickupAddress.label) setPickupAddress(prev => ({...prev, label: 'Your Location'}));
  }, []);

  const fetchPickupAddress = async () => {
    try {
      setLoadingPickup(true);
      const user = await authApi.getStoredUser();
      // Alert.alert("User",JSON.stringify(user));
     
      
      try {
        const profileResponse = await api.get('/profile') as any;
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data;
          
          setPickupAddress({
            label: profile.businessName || profile.fullName || 'Your Location',
            phone: profile.phone || user?.phone || '',
            address: profile.businessAddress || profile.address || 'Current registered address',
          });

          // Priority 1: Merchant Profile City (We just added this to backend)
          if (profile.city) {
              setPickupCity(profile.city);
          } 
          // Priority 2: Try default address if city is still missing
          else {
              try {
                const addressesResponse = await api.get('/profile/addresses') as any;
                if (addressesResponse.success && addressesResponse.data?.length > 0) {
                  const defaultAddress = addressesResponse.data.find((addr: any) => addr.isDefault) || addressesResponse.data[0];
                   if (defaultAddress.city) setPickupCity(defaultAddress.city);
                }
              } catch (e) {
                console.log('Could not fetch addresses');
              }
          }
        } else {
             // Fallback
             setPickupAddress({
                label:user?.fullName || 'Your Location',
                phone: user?.phone || '+1 (555) 123-4567',
                address: 'Current registered address',
              });
        }
      } catch (error) {
        console.log('Could not fetch profile, using defaults');
        setPickupAddress({
          label: 'Your Location',
          phone: user?.phone || '+1 (555) 123-4567',
          address: 'Current registered address',
        });
      }
    } catch (error) {
      console.error('Error fetching pickup address:', error);
      setPickupAddress({
        label: 'Your Location',
        phone: '+1 (555) 123-4567',
        address: 'Current registered address',
      });
    } finally {
      setLoadingPickup(false);
    }
  };

  const handleCreateShipment = async () => {
    // Validate required fields
    if (!receiverName.trim()) {
      Alert.alert('Validation Error', 'Please enter receiver name.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number.');
      return;
    }
    if (!pickupCity.trim()) {
      Alert.alert('Validation Error', 'Please enter pickup city.');
      return;
    }
    if (!receiverCity.trim()) {
      Alert.alert('Validation Error', 'Please enter city.');
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter delivery address.');
      return;
    }
    if (!packageType.trim()) {
      Alert.alert('Validation Error', 'Please select package type.');
      return;
    }
    if (!weight.trim() || parseFloat(weight) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid weight.');
      return;
    }

    setLoading(true);

    try {
      // Prepare package dimensions
      const dimensions = length && width && height
        ? `${length}x${width}x${height}`
        : undefined;

      const shipmentData = {
        recipientName: receiverName,
        recipientPhone: phoneNumber,
        recipientCity: receiverCity,
        pickupAddress: pickupAddress.address,
        pickupPhone: pickupAddress.phone,
        pickupCity: pickupCity,
        deliveryAddress: deliveryAddress,
        packages: [{
          packageType: packageType,
          packageWeight: weight,
          packageSize: 'medium',
          description: specialInstructions || undefined,
        }],
        specialInstructions: specialInstructions || undefined,
        codAmount: codAmount && parseFloat(codAmount) > 0 ? parseFloat(codAmount) : undefined,
        dimensions: dimensions,
      };

      console.log('Creating individual shipment:', shipmentData);

      const response = await shipmentApi.create(shipmentData) as any;

      if (response.success) {
        // Navigate to success screen with tracking number
        const trackingNumber = response.data?.trackingNumber || response.data?.tracking_number || 'CE2025-IND-173414372';
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('ShipmentSuccess', {
            trackingNumber: trackingNumber,
            shipmentType: 'individual',
          });
        } else {
          navigation.navigate('ShipmentSuccess', {
            trackingNumber: trackingNumber,
            shipmentType: 'individual',
          });
        }
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create shipment');
      }
    } catch (error: any) {
      console.error('Error creating individual shipment:', error);
      Alert.alert('Error', error.message || 'Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Green Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Individual Shipment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* PICKUP ADDRESS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PICKUP ADDRESS</Text>
            {!loadingPickup && !isEditingPickup && (
              <TouchableOpacity onPress={handleEditPickup} style={styles.editButton}>
                <Ionicons name="create-outline" size={18} color={colors.success} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingPickup ? (
            <View style={styles.pickupCard}>
              <ActivityIndicator size="small" color={colors.success} />
            </View>
          ) : isEditingPickup ? (
            <View style={styles.pickupCard}>
               {/* Label */}
               <View style={[styles.fieldContainer, { marginBottom: 12 }]}>
                    <Text style={styles.fieldLabel}>Location Label</Text>
                    <TextInput
                        style={styles.pickupInput}
                        value={pickupAddress.label}
                        onChangeText={(t) => setPickupAddress({...pickupAddress, label: t})}
                        placeholder="e.g. Office, Home"
                        placeholderTextColor={colors.textLight}
                    />
               </View>

               {/* Phone */}
               <View style={[styles.fieldContainer, { marginBottom: 12 }]}>
                    <Text style={styles.fieldLabel}>Phone</Text>
                    <TextInput
                        style={styles.pickupInput}
                        value={pickupAddress.phone}
                        onChangeText={(t) => setPickupAddress({...pickupAddress, phone: t})}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textLight}
                    />
               </View>

               {/* City */}
               <View style={[styles.fieldContainer, { marginBottom: 12 }]}>
                    <Text style={styles.fieldLabel}>Pickup City <Text style={styles.requiredIndicator}>*</Text></Text>
                    <TextInput
                        style={styles.pickupInput}
                        value={pickupCity}
                        onChangeText={setPickupCity}
                        placeholder="Required for routing"
                        placeholderTextColor={colors.textLight}
                    />
               </View>

               {/* Address */}
               <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Address</Text>
                    <TextInput
                        style={[styles.pickupInput, { minHeight: 60, textAlignVertical: 'top' }]}
                        value={pickupAddress.address}
                        onChangeText={(t) => setPickupAddress({...pickupAddress, address: t})}
                        multiline
                        placeholderTextColor={colors.textLight}
                    />
               </View>

               {/* Actions */}
               <View style={styles.pickupActions}>
                   <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSavePickup}
                   >
                       <Text style={styles.saveButtonText}>Save & Update</Text>
                   </TouchableOpacity>
               </View>
            </View>
          ) : (
            <View style={styles.pickupCard}>
              <Text style={styles.pickupLabel}>{pickupAddress.label || 'Your Location'}</Text>
              <Text style={styles.pickupPhone}>{pickupAddress.phone}</Text>
              <Text style={styles.pickupAddress}>{pickupAddress.address}</Text>
              {pickupCity ? (
                  <Text style={[styles.pickupAddress, { marginTop: 4, fontStyle: 'italic', opacity: 0.8 }]}>
                      City: {pickupCity}
                  </Text>
              ) : (
                  <Text style={[styles.pickupAddress, { marginTop: 4, color: colors.error }]}>
                      City missing - Click Edit to add
                  </Text>
              )}
            </View>
          )}
        </View>

        {/* DELIVERY ADDRESS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Receiver Name <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter receiver name"
                placeholderTextColor={colors.textLight}
                value={receiverName}
                onChangeText={setReceiverName}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Phone Number <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textLight}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              City <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                placeholderTextColor={colors.textLight}
                value={receiverCity}
                onChangeText={setReceiverCity}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Delivery Address <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter delivery address"
                placeholderTextColor={colors.textLight}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>
          </View>
        </View>

        {/* PARCEL DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PARCEL DETAILS</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Package Type <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowPackageTypeModal(true)}
            >
              <Text style={[styles.input, styles.inputFull, !packageType && styles.placeholderText]}>
                {packageType || 'Package Type'}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color={colors.textLight} style={styles.chevronIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Weight (kg) <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cube-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter weight"
                placeholderTextColor={colors.textLight}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Dimensions */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Dimensions (cm) - Optional</Text>
            <View style={styles.dimensionsContainer}>
              <View style={styles.dimensionFieldContainer}>
                <Text style={styles.dimensionFieldLabel}>Length</Text>
                <TextInput
                  style={styles.dimensionInput}
                  placeholder="Enter length"
                  placeholderTextColor={colors.textLight}
                  value={length}
                  onChangeText={setLength}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.dimensionFieldContainer, { marginHorizontal: spacing.xs }]}>
                <Text style={styles.dimensionFieldLabel}>Width</Text>
                <TextInput
                  style={styles.dimensionInput}
                  placeholder="Enter width"
                  placeholderTextColor={colors.textLight}
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.dimensionFieldContainer}>
                <Text style={styles.dimensionFieldLabel}>Height</Text>
                <TextInput
                  style={styles.dimensionInput}
                  placeholder="Enter height"
                  placeholderTextColor={colors.textLight}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>COD Amount (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter COD amount"
                placeholderTextColor={colors.textLight}
                value={codAmount}
                onChangeText={setCodAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Special Instructions</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputFull, styles.textArea]}
                placeholder="Enter special instructions"
                placeholderTextColor={colors.textLight}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Shipment Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateShipment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.createButtonText}>Create Shipment</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Package Type Selection Modal */}
      {showPackageTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Package Type</Text>
            {packageTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setPackageType(type);
                  setShowPackageTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPackageTypeModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textLight,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickupCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickupLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pickupPhone: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  pickupAddress: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  inputFull: {
    paddingLeft: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  requiredIndicator: {
    fontSize: typography.fontSize.base,
    color: colors.error,
  },
  placeholderText: {
    color: colors.textLight,
  },
  chevronIcon: {
    marginLeft: spacing.xs,
  },
  dimensionsContainer: {
    flexDirection: 'row',
  },
  dimensionFieldContainer: {
    flex: 1,
  },
  dimensionFieldLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  dimensionInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  modalCancel: {
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSize.base,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
  },
  editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
  },
  editButtonText: {
      fontSize: typography.fontSize.sm,
      color: colors.success,
      fontWeight: typography.fontWeight.medium,
  },
  pickupInput: {
      backgroundColor: colors.backgroundInput,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.base,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
  },
  pickupActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.md,
  },
  saveButton: {
      backgroundColor: colors.success,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
  },
  saveButtonText: {
      color: colors.textWhite,
      fontWeight: typography.fontWeight.medium,
      fontSize: typography.fontSize.base,
  },
});

