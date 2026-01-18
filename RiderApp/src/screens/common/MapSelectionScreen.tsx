import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';

// expo-location is optional
// To enable location features, install it: npx expo install expo-location
// For now, location features are disabled to avoid build errors
const LOCATION_ENABLED = false; // Set to true after installing expo-location

// Note: For full map functionality, you'll need to configure Google Maps API
// For now, this is a placeholder that opens external maps
export default function MapSelectionScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { 
    title = 'Select Location',
    onLocationSelect,
    initialLocation 
  } = route.params || {};
  
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    // Location feature is disabled by default
    // To enable: 1) Install expo-location: npx expo install expo-location
    //            2) Set LOCATION_ENABLED = true above
    //            3) Uncomment the location code below
    
    if (!LOCATION_ENABLED) {
      setLoading(false);
      return;
    }

    // Location code (uncomment after installing expo-location):
    /*
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please select a location manually on the map.'
      );
      setLoading(false);
    }
    */
    
    setLoading(false);
  };

  const handleConfirm = () => {
    if (selectedLocation || currentLocation) {
      const location = selectedLocation || currentLocation;
      if (onLocationSelect) {
        onLocationSelect(location);
      }
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please select a location');
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
      Alert.alert('Success', 'Current location selected');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        )}
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>Tap on map to select location</Text>
        </View>
        
        <TouchableOpacity onPress={handleUseCurrentLocation}>
          <Ionicons name="locate" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={80} color={colors.textLight} />
            <Text style={styles.mapPlaceholderText}>Map View</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Google Maps integration required{'\n'}
              For now, tap "Use Current Location" or "Open in Maps"
            </Text>
            
            {/* Location Pin */}
            <View style={styles.locationPin}>
              <Ionicons name="location" size={40} color={colors.error} />
            </View>
          </View>
        )}
      </View>

      {/* Location Info */}
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.locationInfoText}>
            Location selected
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (currentLocation) {
              const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;
              Linking.openURL(url).catch(err => {
                Alert.alert('Error', 'Could not open maps');
                console.error('Failed to open maps:', err);
              });
            } else {
              Alert.alert('No Location', 'Please wait for location to load or use current location button');
            }
          }}
        >
          <Ionicons name="map-outline" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Open in Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!selectedLocation && !currentLocation) && styles.primaryButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation && !currentLocation}
        >
          <Text style={styles.primaryButtonText}>Confirm Location</Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  mapPlaceholderSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  locationPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  locationInfoText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
});

