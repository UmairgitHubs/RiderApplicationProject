import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { addressApi, profileApi } from '../../services/api';

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

export default function ManageAddressesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('John Doe');
  const [userPhone, setUserPhone] = useState('+1 (555) 123-4567');

  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
      fetchUserInfo();
    }, [])
  );

  const fetchUserInfo = async () => {
    try {
      const response: any = await profileApi.getProfile();
      if (response.success && response.data?.profile) {
        const profile = response.data.profile;
        setUserName(profile.fullName || 'John Doe');
        setUserPhone(profile.phone || '+1 (555) 123-4567');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response: any = await addressApi.getAddresses();
      console.log('Address API Response:', JSON.stringify(response, null, 2));
      if (response.success && response.data?.addresses) {
        console.log('Addresses found:', response.data.addresses.length);
        setAddresses(response.data.addresses);
      } else {
        console.log('No addresses in response or response not successful');
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response: any = await addressApi.updateAddress(id, { isDefault: true });
      if (response.success) {
        await fetchAddresses();
      } else {
        Alert.alert('Error', 'Failed to set default address');
      }
    } catch (error: any) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', error.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response: any = await addressApi.deleteAddress(id);
              if (response.success) {
                await fetchAddresses();
              } else {
                Alert.alert('Error', 'Failed to delete address');
              }
            } catch (error: any) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', error.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleAddNew = () => {
    // Get the root navigator (Stack navigator that contains all screens)
    const rootNavigator = navigation.getParent() || navigation;
    
    if (rootNavigator && typeof rootNavigator.navigate === 'function') {
      rootNavigator.navigate('AddAddress');
    } else {
      console.error('Navigation not available');
      Alert.alert('Error', 'Unable to navigate. Please try again.');
    }
  };

  const handleEdit = (address: Address) => {
    console.log('Edit button clicked for address:', address.id);
    console.log('Address data:', JSON.stringify(address, null, 2));
    
    // Get the root navigator (Stack navigator that contains all screens)
    const rootNavigator = navigation.getParent() || navigation;
    
    console.log('Root navigator exists:', !!rootNavigator);
    console.log('Navigate function exists:', typeof rootNavigator.navigate === 'function');
    
    if (rootNavigator && typeof rootNavigator.navigate === 'function') {
      console.log('Navigating to EditAddress with address data');
      rootNavigator.navigate('EditAddress', { address });
    } else {
      console.error('Navigation not available');
      Alert.alert('Error', 'Unable to navigate. Please try again.');
    }
  };

  const getAddressIcon = (label?: string) => {
    if (!label) return 'location';
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return 'home';
    if (lowerLabel.includes('office') || lowerLabel.includes('business')) return 'business';
    return 'location';
  };

  const formatCityState = (address: Address) => {
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
  };

  if (loading) {
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
          <Text style={styles.title}>Manage Addresses</Text>
          <Text style={styles.subtitle}>{addresses.length} saved</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Cards */}
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <View 
              key={address.id} 
              style={[
                styles.addressCard,
                address.is_default && styles.addressCardDefault
              ]}
            >
              {/* Default Badge */}
              {address.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}

              {/* Address Content */}
              <View style={styles.addressContent}>
                <View style={styles.addressIconContainer}>
                  <Ionicons 
                    name={getAddressIcon(address.label) as any} 
                    size={24} 
                    color={colors.text} 
                  />
                </View>
                
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>
                    {address.label || 'Address'}
                  </Text>
                  <Text style={styles.addressNamePhone}>
                    {userName} • {userPhone}
                  </Text>
                  <Text style={styles.addressLine}>
                    {address.address_line1 || ''}
                  </Text>
                  {address.address_line2 ? (
                    <Text style={styles.addressLine}>
                      {address.address_line2}
                    </Text>
                  ) : null}
                  <Text style={styles.addressCityState}>
                    {formatCityState(address)}
                  </Text>
                  {address.postal_code ? (
                    <Text style={styles.addressZip}>
                      {address.postal_code}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.addressActions}>
                {!address.is_default && (
                  <TouchableOpacity 
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(address.id)}
                  >
                    <Text style={styles.setDefaultButtonText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.actionIconButton}
                  onPress={() => handleEdit(address)}
                >
                  <Ionicons name="pencil" size={20} color="#2196F3" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionIconButton, styles.deleteButton]}
                  onPress={() => handleDeleteAddress(address.id)}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No saved addresses</Text>
            <Text style={styles.emptyStateSubtext}>
              Add an address to save time on future shipments
            </Text>
          </View>
        )}

        {/* Add New Address Button */}
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddNew}
        >
          <Ionicons name="add" size={24} color={colors.text} />
          <Text style={styles.addButtonText}>Add New Address</Text>
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
  },
  addressCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCardDefault: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE0B2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  defaultBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  addressContent: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  addressNamePhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  addressLine: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  addressCityState: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  addressZip: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  setDefaultButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  setDefaultButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
  },
});
