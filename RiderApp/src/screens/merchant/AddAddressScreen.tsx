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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { addressApi, profileApi } from '../../services/api';

type AddressType = 'home' | 'work' | 'other';

export default function AddAddressScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartmentSuite, setApartmentSuite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      setFetchingProfile(true);
      const response = await profileApi.getProfile();
      if (response.success && response.data?.profile) {
        const profile = response.data.profile;
        setFullName(profile.fullName || '');
        setPhoneNumber(profile.phone || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

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
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
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

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await addressApi.addAddress({
        label: label.trim(),
        addressLine1: streetAddress.trim(),
        addressLine2: apartmentSuite.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: undefined,
        country: 'United States',
        isDefault: false,
      });

      if (response.success) {
        Alert.alert('Success', 'Address saved successfully', [
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
        Alert.alert('Error', 'Failed to save address. Please try again.');
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.message || 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
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
          <Text style={styles.title}>Add Address</Text>
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
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor={colors.textLight}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>
            Phone Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textLight}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
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
        </View>

      </ScrollView>

      {/* Save Address Button Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
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

