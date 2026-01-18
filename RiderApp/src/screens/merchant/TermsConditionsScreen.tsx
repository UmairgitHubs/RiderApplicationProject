import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function TermsConditionsScreen({ navigation }: any) {
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
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Last updated: Dec 1, 2024</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using COD Express ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>

          <Text style={styles.sectionTitle}>2. Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily download one copy of the materials on COD Express's mobile application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Modify or copy the materials</Text>
            <Text style={styles.bulletPoint}>• Use the materials for any commercial purpose or for any public display</Text>
            <Text style={styles.bulletPoint}>• Attempt to reverse engineer any software contained in the App</Text>
            <Text style={styles.bulletPoint}>• Remove any copyright or other proprietary notations from the materials</Text>
            <Text style={styles.bulletPoint}>• Transfer the materials to another person or "mirror" the materials on any other server</Text>
          </View>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
          </Text>

          <Text style={styles.sectionTitle}>4. Service Terms</Text>
          <Text style={styles.paragraph}>
            COD Express provides a delivery and logistics platform connecting merchants with delivery riders. We reserve the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Modify or discontinue the service at any time</Text>
            <Text style={styles.bulletPoint}>• Refuse service to anyone for any reason at any time</Text>
            <Text style={styles.bulletPoint}>• Update pricing and fees with prior notice</Text>
            <Text style={styles.bulletPoint}>• Suspend or terminate accounts that violate these terms</Text>
          </View>

          <Text style={styles.sectionTitle}>5. Payment Terms</Text>
          <Text style={styles.paragraph}>
            All fees are quoted in USD. You are responsible for paying all fees and applicable taxes associated with our Service in a timely manner with a valid payment method. If your payment method fails, we reserve the right to suspend or terminate your access to the Service.
          </Text>
          <Text style={styles.paragraph}>
            Refunds are processed according to our refund policy. Cancellations made before rider pickup are eligible for full refund within 3-5 business days.
          </Text>

          <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
          <Text style={styles.paragraph}>
            You may not use the App for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction. Prohibited items for shipment include but are not limited to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Illegal drugs or controlled substances</Text>
            <Text style={styles.bulletPoint}>• Weapons, ammunition, or explosives</Text>
            <Text style={styles.bulletPoint}>• Hazardous or flammable materials</Text>
            <Text style={styles.bulletPoint}>• Stolen goods or counterfeit items</Text>
            <Text style={styles.bulletPoint}>• Live animals or perishable goods without proper packaging</Text>
          </View>

          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            COD Express shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability shall not exceed the amount you paid for the specific service in question.
          </Text>

          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The App and its original content, features, and functionality are owned by COD Express and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </Text>

          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </Text>

          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>Email: legal@codexpress.com</Text>
            <Text style={styles.contactText}>Phone: +1 (555) 100-2000</Text>
            <Text style={styles.contactText}>Address: 123 Business Ave, New York, NY 10001</Text>
          </View>

          <View style={styles.acceptanceBox}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.acceptanceText}>
              By using COD Express, you acknowledge that you have read and understood these Terms and Conditions.
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
  contentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
    textAlign: 'justify',
  },
  bulletList: {
    marginLeft: spacing.md,
    marginBottom: spacing.md,
  },
  bulletPoint: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  contactInfo: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  contactText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  acceptanceBox: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginTop: spacing.lg,
  },
  acceptanceText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.md,
    lineHeight: 20,
  },
});



