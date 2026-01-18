import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function AboutScreen({ navigation }: any) {
  const appInfo = {
    version: '1.0.0',
    buildNumber: '100',
    releaseDate: 'December 2024',
  };

  const teamMembers = [
    { name: 'Development Team', role: 'Software Engineers' },
    { name: 'Design Team', role: 'UI/UX Designers' },
    { name: 'Support Team', role: 'Customer Support' },
  ];

  const socialLinks = [
    { icon: 'logo-facebook', label: 'Facebook', url: 'https://facebook.com' },
    { icon: 'logo-twitter', label: 'Twitter', url: 'https://twitter.com' },
    { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com' },
    { icon: 'logo-linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
  ];

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
          <Text style={styles.title}>About COD Express</Text>
          <Text style={styles.subtitle}>Fast & Reliable Delivery</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo & Info */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../../assets/logo.jpeg')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>COD Express</Text>
          <Text style={styles.tagline}>Your Trusted Delivery Partner</Text>
          <Text style={styles.versionText}>Version {appInfo.version} ({appInfo.buildNumber})</Text>
        </View>

        {/* About Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>
              COD Express is dedicated to providing fast, reliable, and secure delivery services. 
              We connect merchants with professional riders to ensure your packages reach their 
              destination safely and on time.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresCard}>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Fast Delivery</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Real-time Tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Secure & Insured</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cash" size={24} color={colors.primary} />
              <Text style={styles.featureText}>COD Available</Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamCard}>
              <View style={styles.teamIcon}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((link, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.socialButton}
                onPress={() => Linking.openURL(link.url)}
              >
                <Ionicons name={link.icon as any} size={24} color={colors.textWhite} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={styles.contactText}>support@codexpress.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={styles.contactText}>+1 (555) 100-2000</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.contactText}>123 Business Ave, New York, NY 10001</Text>
            </View>
          </View>
        </View>

        {/* Developer Credit */}
        <View style={styles.developerSection}>
          <Text style={styles.developerTitle}>Developed by</Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://www.zimlitech.com')}
            style={styles.developerCard}
          >
            <Text style={styles.developerName}>Zimli Tech</Text>
            <Text style={styles.developerWebsite}>www.zimlitech.com</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} style={styles.externalIcon} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 COD Express. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Released: {appInfo.releaseDate}
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
  orangeHeader: {
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
    paddingBottom: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
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
  descriptionCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  featuresCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: typography.fontWeight.medium,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  teamRole: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  contactCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  developerSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  developerTitle: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  developerCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  developerName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  developerWebsite: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  externalIcon: {
    marginTop: spacing.xs,
  },
  copyrightSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  copyrightText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  copyrightSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
});

