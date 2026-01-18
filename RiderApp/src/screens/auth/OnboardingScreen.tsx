import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const onboardingData = [
    {
      icon: 'cube-outline',
      title: t('onboarding.slide1Title'),
      description: t('onboarding.slide1Description'),
    },
    {
      icon: 'location-outline',
      title: t('onboarding.slide2Title'),
      description: t('onboarding.slide2Description'),
    },
    {
      icon: 'flash-outline',
      title: t('onboarding.slide3Title'),
      description: t('onboarding.slide3Description'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('onboarding.slide4Title'),
      description: t('onboarding.slide4Description'),
    },
  ];
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      navigation.replace('RoleSelection');
    }
  };

  const handleSkip = () => {
    navigation.replace('RoleSelection');
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>

      {/* Onboarding Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={styles.slide}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={80} color={colors.textWhite} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      {/* Next/Get Started Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentIndex === onboardingData.length - 1 ? t('onboarding.getStarted') : t('common.next')}{' '}
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Text>
      </TouchableOpacity>

      {/* Zimli Tech Credit - Only show on last slide */}
      {currentIndex === onboardingData.length - 1 && (
        <View style={styles.creditContainer}>
          <Text style={styles.creditText}>Developed by</Text>
          <Text style={styles.creditCompany}>Zimli Tech</Text>
          <Text style={styles.creditWebsite}>www.zimlitech.com</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.iconBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 45,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textWhite,
    opacity: 0.3,
  },
  paginationDotActive: {
    width: 24,
    opacity: 1,
  },
  nextButton: {
    backgroundColor: colors.textWhite,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  nextButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  creditContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  creditText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  creditCompany: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  creditWebsite: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    opacity: 0.8,
  },
});

