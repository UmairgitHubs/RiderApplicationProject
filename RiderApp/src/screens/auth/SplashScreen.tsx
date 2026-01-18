import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    // Navigate to onboarding after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* COD Express Logo */}
      <Image 
        source={require('../../../assets/logo.jpeg')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>COD Express</Text>
      <Text style={styles.tagline}>Fast Delivery Service</Text>
      
      {/* Zimli Tech Credit */}
      <View style={styles.creditContainer}>
        <Text style={styles.creditText}>Developed by</Text>
        <Text style={styles.creditCompany}>Zimli Tech</Text>
        <Text style={styles.creditWebsite}>www.zimlitech.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing['3xl'],
  },
  creditContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    alignItems: 'center',
  },
  creditText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  creditCompany: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  creditWebsite: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
});

