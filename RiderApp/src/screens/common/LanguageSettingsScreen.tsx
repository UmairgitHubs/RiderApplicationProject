import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function LanguageSettingsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      icon: '🇬🇧',
    },
    {
      code: 'ur',
      name: 'Urdu',
      nativeName: 'اردو',
      icon: '🇵🇰',
    },
  ];

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === language) return;

    Alert.alert(
      t('settings.selectLanguage'),
      'Changing language will restart the app for RTL support. Continue?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.ok'),
          onPress: async () => {
            setSelectedLanguage(langCode);
            await setLanguage(langCode);
            
            // Show message that app needs restart for full RTL support
            Alert.alert(
              t('common.success'),
              'Language changed! Please restart the app for RTL layout to take effect.',
              [
                {
                  text: t('common.ok'),
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{t('settings.languageSettings')}</Text>
          <Text style={styles.subtitle}>{t('settings.selectLanguage')}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.selectLanguage')}</Text>
          
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                selectedLanguage === lang.code && styles.languageCardActive,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.languageIcon}>{lang.icon}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === lang.code && styles.languageNameActive,
                  ]}>
                    {lang.name}
                  </Text>
                  <Text style={[
                    styles.languageNativeName,
                    selectedLanguage === lang.code && styles.languageNativeNameActive,
                  ]}>
                    {lang.nativeName}
                  </Text>
                </View>
              </View>
              
              {selectedLanguage === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>RTL Support</Text>
            <Text style={styles.infoText}>
              For Urdu (اردو), the app will switch to Right-to-Left (RTL) layout. 
              Please restart the app after changing language for full RTL support.
            </Text>
          </View>
        </View>

        {/* Current Language Info */}
        <View style={styles.currentLanguageCard}>
          <Text style={styles.currentLanguageLabel}>Current Language:</Text>
          <Text style={styles.currentLanguageValue}>
            {languages.find(l => l.code === language)?.name || 'English'}
          </Text>
        </View>
      </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F0',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  languageNameActive: {
    color: colors.primary,
  },
  languageNativeName: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  languageNativeNameActive: {
    color: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoIconContainer: {
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  currentLanguageCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  currentLanguageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  currentLanguageValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});



