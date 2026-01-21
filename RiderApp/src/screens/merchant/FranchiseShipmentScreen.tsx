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
import * as DocumentPicker from 'expo-document-picker';

export default function FranchiseShipmentScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageType, setPackageType] = useState('');
  const [showPackageTypeModal, setShowPackageTypeModal] = useState(false);
  
  const packageTypes = [
    'Electronics',
    'Clothing',
    'Documents',
    'Food',
    'Fragile',
    'Other',
  ];
  const [numberOfPackages, setNumberOfPackages] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [excelFile, setExcelFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [loadingPickup, setLoadingPickup] = useState(true);

  // Pickup address state
  const [pickupAddress, setPickupAddress] = useState({
    businessName: '',
    phone: '',
    address: '',
    city: '',
  });

  // Fetch user profile and default address on mount
  useEffect(() => {
    fetchPickupAddress();
  }, []);

  const fetchPickupAddress = async () => {
    try {
      setLoadingPickup(true);
      // Try to get user profile
      const user = await authApi.getStoredUser();
      
      try {
        const profileResponse = await api.get('/profile') as any;
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data;
          
          setPickupAddress({
            businessName: profile.businessName || profile.fullName || 'My Business',
            phone: profile.phone || user?.phone || '',
            address: profile.businessAddress || profile.address || '123 Broadway, New York, NY 10001',
            city: profile.city || '',
          });

         // Priority 1: Merchant Profile City
          if (profile.city) {
               setPickupAddress(prev => ({ ...prev, city: profile.city }));
          } 
          // Priority 2: Default Address
          else {
              try {
                const addressesResponse = await api.get('/profile/addresses') as any;
                if (addressesResponse.success && addressesResponse.data?.length > 0) {
                  const defaultAddress = addressesResponse.data.find((addr: any) => addr.isDefault) || addressesResponse.data[0];
                  
                  setPickupAddress(prev => ({
                      ...prev,
                      address: defaultAddress 
                      ? `${defaultAddress.addressLine1 || ''}${defaultAddress.addressLine2 ? ', ' + defaultAddress.addressLine2 : ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} ${defaultAddress.postalCode || ''}`.trim()
                      : prev.address,
                      city: defaultAddress.city || prev.city || ''
                  }));
                  
                  return;
                }
              } catch (e) {
                console.log('Could not fetch addresses, using profile data');
              }
          }
        } else {
             // Fallback to default
            setPickupAddress({
                businessName: user?.fullName || 'My Business',
                phone: user?.phone || '+1 (555) 123-4567',
                address: '123 Broadway, New York, NY 10001',
                city: '',
            });
        }
      } catch (error) {
        console.log('Could not fetch profile, using defaults');
        setPickupAddress({
          businessName: user?.fullName || 'Tech Store NYC',
          phone: user?.phone || '+1 (555) 123-4567',
          address: '123 Broadway, New York, NY 10001',
          city: '',
        });
      }
    } catch (error) {
      console.error('Error fetching pickup address:', error);
      setPickupAddress({
        businessName: 'Tech Store NYC',
        phone: '+1 (555) 123-4567',
        address: '123 Broadway, New York, NY 10001',
        city: '',
      });
    } finally {
      setLoadingPickup(false);
    }
  };

  const handleEditPickup = () => {
    setIsEditingPickup(true);
  };

  const handleSavePickup = () => {
    if (!pickupAddress.businessName || !pickupAddress.address) {
      Alert.alert('Validation Error', 'Please fill in business name and address.');
      return;
    }
    setIsEditingPickup(false);
  };

  const handleSelectPickupLocation = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('MapSelection', {
        title: 'Select Pickup Location',
        onLocationSelect: (location: any) => {
          setPickupAddress({
            ...pickupAddress,
            address: location.address || `${location.latitude}, ${location.longitude}`,
          });
        },
      });
    }
  };

  const handleExcelUpload = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setExcelFile(result.assets[0]);
        Alert.alert('Success', 'Excel file uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!receiverName.trim()) {
      Alert.alert('Validation Error', 'Please enter receiver name.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number.');
      return;
    }
    if (!(pickupAddress as any).city?.trim()) {
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
    // ... (rest of validation)

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
        pickupAddress: `${pickupAddress.businessName}, ${pickupAddress.address}`,
        pickupPhone: pickupAddress.phone,
        pickupCity: (pickupAddress as any).city,
        deliveryAddress: deliveryAddress,
        packages: [{
          packageType: packageType,
          packageWeight: weight,
          packageSize: 'medium', // Default size
          description: specialInstructions || undefined,
        }],
        specialInstructions: specialInstructions || undefined,
        // Add franchise-specific data
        numberOfPackages: numberOfPackages ? parseInt(numberOfPackages) : 1,
        dimensions: dimensions,
        excelFile: excelFile ? excelFile.uri : undefined,
        shipmentType: 'franchise',
      };

      console.log('Creating franchise shipment:', shipmentData);

      let response: any;
      
      if (shipmentData.shipmentType === 'franchise' && excelFile) {
          const formData = new FormData();
          formData.append('shipmentType', 'franchise');
          formData.append('recipientName', shipmentData.recipientName);
          formData.append('recipientPhone', shipmentData.recipientPhone);
          formData.append('recipientCity', shipmentData.recipientCity);
          formData.append('pickupAddress', shipmentData.pickupAddress);
          formData.append('pickupPhone', (shipmentData as any).pickupPhone || '');
          formData.append('pickupCity', (shipmentData as any).pickupCity || '');
          formData.append('deliveryAddress', shipmentData.deliveryAddress);
          formData.append('specialInstructions', shipmentData.specialInstructions || '');
          formData.append('numberOfPackages', String(shipmentData.numberOfPackages || 1));
          if (shipmentData.dimensions) formData.append('dimensions', shipmentData.dimensions);
          
          formData.append('packageType', shipmentData.packages[0].packageType);
          formData.append('packageWeight', shipmentData.packages[0].packageWeight);

          // Append packages array as string
          formData.append('packages', JSON.stringify(shipmentData.packages));

          // Append file
          formData.append('excelFile', {
            uri: excelFile.uri,
            type: excelFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            name: excelFile.name || 'upload.xlsx'
          } as any);

          response = await shipmentApi.create(formData);
      } else {
          response = await shipmentApi.create(shipmentData);
      }

      if (response.success) {
        // Navigate to success screen with tracking number
        const trackingNumber = response.data?.trackingNumber || response.data?.tracking_number || 'CE2025-FRN-173414372';
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('ShipmentSuccess', {
            trackingNumber: trackingNumber,
            shipmentType: 'franchise',
          });
        } else {
          navigation.navigate('ShipmentSuccess', {
            trackingNumber: trackingNumber,
            shipmentType: 'franchise',
          });
        }
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create shipment');
      }
    } catch (error: any) {
      console.error('Error creating franchise shipment:', error);
      Alert.alert('Error', error.message || 'Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Franchise</Text>
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
            {!isEditingPickup && (
              <TouchableOpacity onPress={handleEditPickup} style={styles.editButton}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingPickup ? (
            <View style={styles.pickupCard}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : isEditingPickup ? (
            <View style={styles.pickupCard}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Business Name</Text>
                <TextInput
                  style={styles.pickupInput}
                  value={pickupAddress.businessName}
                  onChangeText={(text) => setPickupAddress({ ...pickupAddress, businessName: text })}
                  placeholder="Enter business name"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.pickupInput}
                  value={pickupAddress.phone}
                  onChangeText={(text) => setPickupAddress({ ...pickupAddress, phone: text })}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.pickupInput}
                  value={(pickupAddress as any).city || ''}
                  onChangeText={(text) => setPickupAddress({ ...pickupAddress, city: text } as any)}
                  placeholder="Enter city"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Address</Text>
                <View style={styles.addressInputContainer}>
                  <TextInput
                    style={[styles.pickupInput, styles.addressInput]}
                    value={pickupAddress.address}
                    onChangeText={(text) => setPickupAddress({ ...pickupAddress, address: text })}
                    placeholder="Enter address"
                    placeholderTextColor={colors.textLight}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={handleSelectPickupLocation}
                  >
                    <Ionicons name="map-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.pickupActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditingPickup(false);
                    fetchPickupAddress(); // Reset to original
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSavePickup}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.pickupCard}>
              <Text style={styles.pickupBusinessName}>{pickupAddress.businessName}</Text>
              <Text style={styles.pickupPhone}>{pickupAddress.phone}</Text>
              <Text style={styles.pickupAddressText}>{pickupAddress.address}</Text>
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
            <Text style={styles.fieldLabel}>Number of Packages</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputFull]}
                placeholder="Enter number of packages"
                placeholderTextColor={colors.textLight}
                value={numberOfPackages}
                onChangeText={setNumberOfPackages}
                keyboardType="number-pad"
              />
            </View>
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
                  placeholder="Length"
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
                  placeholder="Width"
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
                  placeholder="Height"
                  placeholderTextColor={colors.textLight}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
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

        {/* EXCEL UPLOAD */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add attachment excel sheet with details</Text>
          
          <TouchableOpacity
            style={styles.excelUploadCard}
            onPress={handleExcelUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={40} color={colors.primary} />
                <Text style={styles.excelUploadTitle}>Upload Excel File</Text>
                <Text style={styles.excelUploadSubtitle}>Click to browse .xlsx or .xls files</Text>
              </>
            )}
          </TouchableOpacity>

          {excelFile && (
            <View style={styles.fileInfo}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.fileName} numberOfLines={1}>{excelFile.name}</Text>
            </View>
          )}

          <Text style={styles.excelDescription}>
            Upload an Excel file with detailed package information for bulk processing
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: colors.primary,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
  pickupBusinessName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pickupPhone: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pickupAddressText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
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
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  addressInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  mapButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
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
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  excelUploadCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 150,
  },
  excelUploadTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  excelUploadSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fileName: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  excelDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  placeholderText: {
    color: colors.textLight,
  },
  chevronIcon: {
    marginLeft: spacing.xs,
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
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

