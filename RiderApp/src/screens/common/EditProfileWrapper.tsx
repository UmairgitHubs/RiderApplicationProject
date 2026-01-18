import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { authApi } from '../../services/api';
import EditProfileScreen from '../merchant/EditProfileScreen';
import RiderEditProfileScreen from '../rider/RiderEditProfileScreen';
import { colors } from '../../theme';

export default function EditProfileWrapper() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const user = await authApi.getStoredUser();
      setUserRole(user?.role || null);
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (userRole === 'rider') {
    return <RiderEditProfileScreen />;
  }

  return <EditProfileScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
});

