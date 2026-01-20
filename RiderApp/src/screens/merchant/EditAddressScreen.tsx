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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { addressApi } from '../../services/api';

type AddressType = 'home' | 'work' | 'other';

interface Address {
  id: string;
  label?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default: boolean;
}

export default function EditAddressScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(true);
  
  const addressData: Address = route.params?.address;
  
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [label, setLabel] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartmentSuite, setApartmentSuite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    console.log('EditAddressScreen mounted');
    console.log('Route params:', route.params);
    console.log('Address data from params:', addressData);
    
    if (addressData) {
      console.log('Populating form with address data');
      // Populate form with existing address data
      setLabel(addressData.label || 'Home');
      setStreetAddress(addressData.address_line1 || '');
      setApartmentSuite(addressData.address_line2 || '');
      setCity(addressData.city || '');
      setState(addressData.state || '');
      setIsDefault(addressData.is_default || false);
      
      // Determine address type from label
      const lowerLabel = (addressData.label || '').toLowerCase();
      if (lowerLabel.includes('work') || lowerLabel.includes('office')) {
        setAddressType('work');
      } else if (lowerLabel.includes('home')) {
        setAddressType('home');
      } else {
        setAddressType('other');
      }
      
      console.log('Form populated successfully');
      setFetchingAddress(false);
    } else {
      console.error('No address data provided in route params');
      Alert.alert('Error', 'No address data provided', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [addressData]);

  const getAddressTypeLabel = (type: AddressType) => {
    switch (type) {
      case 'home':
        return 'Home';
      case 'work':
        return 'Work';
      case 'other':
        return 'Other';
    }
  };

  const getAddressTypeIcon = (type: AddressType) => {
    switch (type) {
      case 'home':
        return 'home';
      case 'work':
        return 'briefcase';
      case 'other':
        return 'location';
    }
  };

  const validateForm = () => {
    if (!label.trim()) {
      Alert.alert('Validation Error', 'Please enter a label for the address');
      return false;
    }
    if (!streetAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter the street address');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please enter the city');
      return false;
    }
    if (!state.trim()) {
      Alert.alert('Validation Error', 'Please enter the state');
      return false;
    }
    return true;
  };

  const handleUpdateAddress = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response: any = await addressApi.updateAddress(addressData.id, {
        label: label.trim(),
        addressLine1: streetAddress.trim(),
        addressLine2: apartmentSuite.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: undefined,
        country: 'United States',
        isDefault: isDefault,
      });

      if (response.success) {
        Alert.alert('Success', 'Address updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              const parent = navigation.getParent();
              if (parent && parent.canGoBack()) {
                parent.goBack();
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to update address. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating address:', error);
      Alert.alert('Error', error.message || 'Failed to update address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingAddress) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent && parent.canGoBack()) {
              parent.goBack();
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Edit Address</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Type Selection */}
        <Text style={styles.sectionTitle}>Address Type</Text>
        <View style={styles.addressTypeContainer}>
          {(['home', 'work', 'other'] as AddressType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.addressTypeOption,
                addressType === type && styles.addressTypeOptionSelected,
              ]}
              onPress={() => {
                setAddressType(type);
                setLabel(getAddressTypeLabel(type));
              }}
            >
              <Ionicons
                name={getAddressTypeIcon(type) as any}
                size={24}
                color={addressType === type ? colors.primary : colors.textLight}
              />
              <Text
                style={[
                  styles.addressTypeText,
                  addressType === type && styles.addressTypeTextSelected,
                ]}
              >
                {getAddressTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>
            Label <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Home, Office, etc."
            placeholderTextColor={colors.textLight}
            value={label}
            onChangeText={setLabel}
          />

          <Text style={styles.label}>
            Street Address <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter street address"
            placeholderTextColor={colors.textLight}
            value={streetAddress}
            onChangeText={setStreetAddress}
          />

          <Text style={styles.label}>
            Apartment, Suite, etc. (Optional)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter apartment or suite"
            placeholderTextColor={colors.textLight}
            value={apartmentSuite}
            onChangeText={setApartmentSuite}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>
                City <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                placeholderTextColor={colors.textLight}
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>
                State <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter state"
                placeholderTextColor={colors.textLight}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          {/* Set as Default Toggle */}
          <TouchableOpacity 
            style={styles.defaultToggle}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View style={styles.defaultToggleLeft}>
              <Ionicons 
                name={isDefault ? "checkbox" : "square-outline"} 
                size={24} 
                color={isDefault ? colors.primary : colors.textLight} 
              />
              <Text style={styles.defaultToggleText}>Set as default address</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Update Address Button Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleUpdateAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.saveButtonText}>Update Address</Text>
          )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  addressTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  addressTypeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3E0',
  },
  addressTypeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textLight,
  },
  addressTypeTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  defaultToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  defaultToggleText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
