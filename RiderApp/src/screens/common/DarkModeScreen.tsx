import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme';

export default function DarkModeScreen() {
  const navigation = useNavigation<any>();
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Dark Mode</Text>
          <Text style={styles.headerSubtitle}>Choose your preferred theme</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Toggle */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.backgroundLight }]}>
                  <Ionicons
                    name={theme === 'dark' ? 'moon' : 'sunny'}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textLight }]}>
                    {theme === 'dark'
                      ? 'Dark theme is currently enabled'
                      : 'Light theme is currently enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={colors.textWhite}
              />
            </View>
          </View>
        </View>

        {/* Theme Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.background }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewAvatarText}>M</Text>
              </View>
              <View>
                <Text style={[styles.previewName, { color: colors.text }]}>Merchant User</Text>
                <Text style={[styles.previewEmail, { color: colors.textLight }]}>
                  merchant@test.com
                </Text>
              </View>
            </View>
            <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
            <View style={styles.previewContent}>
              <Text style={[styles.previewText, { color: colors.text }]}>
                This is how your app will look with {theme === 'dark' ? 'dark' : 'light'} mode
                enabled.
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.textLight }]}>
              Dark mode reduces eye strain in low-light conditions and can help save battery on
              OLED displays.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  settingCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
  },
  previewCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  previewAvatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  previewName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  previewEmail: {
    fontSize: typography.fontSize.sm,
  },
  previewDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  previewContent: {
    marginTop: spacing.sm,
  },
  previewText: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});



