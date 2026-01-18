import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ComingSoonScreenProps {
  navigation: any;
  route?: {
    params?: {
      featureName?: string;
      description?: string;
    };
  };
}

export default function ComingSoonScreen({ navigation, route }: ComingSoonScreenProps) {
  const featureName = route?.params?.featureName || 'This Feature';
  const description = route?.params?.description || 'We\'re working hard to bring you this feature. Stay tuned for updates!';

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
          <Text style={styles.title}>{featureName}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="rocket" size={80} color={colors.primary} />
        </View>

        <Text style={styles.comingSoonText}>Coming Soon!</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.featuresBox}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.featureText}>Enhanced user experience</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.featureText}>Powerful features</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.featureText}>Regular updates</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.notifyButton}
          onPress={() => {
            // TODO: Implement notification signup
            alert('You\'ll be notified when this feature is available!');
          }}
        >
          <Ionicons name="notifications" size={20} color={colors.textWhite} />
          <Text style={styles.notifyButtonText}>Notify Me When Available</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backHomeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHomeText}>Go Back</Text>
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
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 140,
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  comingSoonText: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  featuresBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  notifyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  backHomeButton: {
    paddingVertical: spacing.sm,
  },
  backHomeText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});



