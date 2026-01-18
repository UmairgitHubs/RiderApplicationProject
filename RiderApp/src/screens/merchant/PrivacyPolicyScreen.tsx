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

export default function PrivacyPolicyScreen({ navigation }: any) {
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
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last updated: Dec 1, 2024</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <Text style={styles.introText}>
            At COD Express, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.subSectionTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            We collect information that you provide directly to us, including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Name and contact information (email, phone number)</Text>
            <Text style={styles.bulletPoint}>• Business information (business name, address)</Text>
            <Text style={styles.bulletPoint}>• Payment information (credit card details, billing address)</Text>
            <Text style={styles.bulletPoint}>• Shipment details (pickup and delivery addresses, package information)</Text>
            <Text style={styles.bulletPoint}>• Profile information (photo, preferences)</Text>
          </View>

          <Text style={styles.subSectionTitle}>Automatically Collected Information</Text>
          <Text style={styles.paragraph}>
            When you use our App, we automatically collect certain information, including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Device information (model, operating system, unique identifiers)</Text>
            <Text style={styles.bulletPoint}>• Location data (GPS, IP address)</Text>
            <Text style={styles.bulletPoint}>• Usage data (features accessed, time spent, actions taken)</Text>
            <Text style={styles.bulletPoint}>• Log data (crashes, system activity)</Text>
          </View>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.bulletPoint}>• Process transactions and send transaction notifications</Text>
            <Text style={styles.bulletPoint}>• Match merchants with available riders</Text>
            <Text style={styles.bulletPoint}>• Provide real-time tracking and delivery updates</Text>
            <Text style={styles.bulletPoint}>• Send you technical notices and support messages</Text>
            <Text style={styles.bulletPoint}>• Respond to your comments and questions</Text>
            <Text style={styles.bulletPoint}>• Detect, prevent, and address fraud and security issues</Text>
            <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
          </View>

          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We may share your information in the following situations:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>With Riders:</Text> We share necessary delivery information with assigned riders</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>With Service Providers:</Text> We share information with third-party vendors who perform services on our behalf</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>For Legal Reasons:</Text> We may disclose information if required by law or in response to legal requests</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Business Transfers:</Text> In connection with any merger, sale, or acquisition</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>With Your Consent:</Text> We may share information with your explicit consent</Text>
          </View>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
            <Text style={styles.bulletPoint}>• Regular security assessments and updates</Text>
            <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
            <Text style={styles.bulletPoint}>• Secure payment processing through certified providers</Text>
          </View>
          <Text style={styles.paragraph}>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            You have the following rights regarding your personal information:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Access:</Text> Request access to your personal data</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Correction:</Text> Update or correct inaccurate information</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Deletion:</Text> Request deletion of your personal data</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Opt-Out:</Text> Unsubscribe from marketing communications</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Data Portability:</Text> Request a copy of your data in a portable format</Text>
          </View>

          <Text style={styles.sectionTitle}>6. Location Information</Text>
          <Text style={styles.paragraph}>
            We collect and use location data to provide core features of our service, including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Matching you with nearby riders</Text>
            <Text style={styles.bulletPoint}>• Providing real-time tracking</Text>
            <Text style={styles.bulletPoint}>• Calculating delivery fees and routes</Text>
            <Text style={styles.bulletPoint}>• Verifying pickup and delivery locations</Text>
          </View>
          <Text style={styles.paragraph}>
            You can disable location services through your device settings, but this may affect app functionality.
          </Text>

          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
          </Text>

          <Text style={styles.sectionTitle}>8. Changes to Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </Text>

          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={styles.contactText}>privacy@codexpress.com</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <Text style={styles.contactText}>+1 (555) 100-2000</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.contactText}>123 Business Ave, New York, NY 10001</Text>
            </View>
          </View>

          <View style={styles.protectionBox}>
            <Ionicons name="shield-checkmark" size={32} color={colors.success} />
            <View style={styles.protectionContent}>
              <Text style={styles.protectionTitle}>Your Privacy is Protected</Text>
              <Text style={styles.protectionText}>
                We are committed to protecting your personal information and ensuring transparency in how we use your data.
              </Text>
            </View>
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
  introText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  subSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  boldText: {
    fontWeight: typography.fontWeight.bold,
  },
  contactInfo: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginLeft: spacing.md,
  },
  protectionBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  protectionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  protectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  protectionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});



