import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { authApi } from '../../services/api';
import NotificationsScreen from '../merchant/NotificationsScreen';
import RiderNotificationsScreen from '../rider/RiderNotificationsScreen';
import { colors } from '../../theme';

export default function NotificationsWrapper({ navigation }: any) {
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
    return <RiderNotificationsScreen navigation={navigation} />;
  }

  return <NotificationsScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
});

