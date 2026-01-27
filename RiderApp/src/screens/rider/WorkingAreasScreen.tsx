import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useWorkingAreas, WorkingArea } from '../../hooks/useWorkingAreas';

// --- Constants ---
const HEADER_HEIGHT = 140;

// --- Sub-components ---

const InfoCard = () => (
  <View style={styles.infoCard}>
    <Ionicons name="information-circle-outline" size={24} color="#1976D2" style={styles.infoIcon} />
    <Text style={styles.infoText}>
      Your working areas are assigned by your hub. Contact your hub manager to request changes.
    </Text>
  </View>
);

const AreaCard = ({ area }: { area: WorkingArea }) => (
  <View style={styles.areaCard}>
    <View style={styles.areaIconContainer}>
      <Ionicons name="location-outline" size={24} color="#4CAF50" />
    </View>
    <View style={styles.areaContent}>
      <View style={styles.areaHeader}>
        <Text style={styles.areaTitle}>{area.city}, {area.state}</Text>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{area.status}</Text>
        </View>
      </View>
      <Text style={styles.zipCodes}>
        ZIP: {area.zipCodes.slice(0, 3).join(', ')}{area.zipCodes.length > 3 ? ` +${area.zipCodes.length - 3} more` : ''}
      </Text>
      <View style={styles.metaContainer}>
        <Text style={styles.metaText}>Assigned by: {area.assignedBy}</Text>
        <Text style={styles.metaText}>Date: {area.assignedDate}</Text>
      </View>
    </View>
  </View>
);

const CoverageCard = ({ activeAreas, totalZipCodes }: { activeAreas: number; totalZipCodes: number }) => (
  <View style={styles.coverageCard}>
    <View style={styles.coverageHeader}>
      <Ionicons name="shield-checkmark-outline" size={20} color="#2E7D32" />
      <Text style={styles.coverageTitle}>Coverage Information</Text>
    </View>
    <View style={styles.coverageItem}>
      <View style={styles.bulletPoint} />
      <Text style={styles.coverageText}>You can accept orders only from your assigned areas.</Text>
    </View>
    <View style={styles.coverageItem}>
      <View style={styles.bulletPoint} />
      <Text style={styles.coverageText}>
        Active areas: <Text style={styles.highlightText}>{activeAreas}</Text>
      </Text>
    </View>
    <View style={styles.coverageItem}>
      <View style={styles.bulletPoint} />
      <Text style={styles.coverageText}>
        Total ZIP codes covered: <Text style={styles.highlightText}>{totalZipCodes}</Text>
      </Text>
    </View>
  </View>
);

const ContactCard = () => (
  <View style={styles.contactCard}>
    <Text style={styles.contactTitle}>Need Area Changes?</Text>
    <Text style={styles.contactDescription}>
      Contact your hub manager to request area assignments or modifications.
    </Text>
    <TouchableOpacity 
      style={styles.contactButton}
      onPress={() => Linking.openURL('tel:1234567890')} // Mock action
    >
      <Text style={styles.contactButtonText}>Contact Hub Manager</Text>
    </TouchableOpacity>
  </View>
);

// --- Main Screen ---

export default function WorkingAreasScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { areas, stats, isLoading } = useWorkingAreas();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Working Areas</Text>
          <Text style={styles.headerSubtitle}>Your assigned delivery zones</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <InfoCard />

        <Text style={styles.sectionLabel}>ASSIGNED AREAS</Text>
        
        {areas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}

        <CoverageCard activeAreas={stats.activeAreas} totalZipCodes={stats.totalZipCodes} />

        <ContactCard />
        
        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    top: Platform.OS === 'ios' ? 60 : 40, // Adjust based on safe area if needed, or rely on insets
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#0D47A1',
    lineHeight: 20,
    flexShrink: 1,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textLight,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  areaCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  areaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  areaContent: {
    flex: 1,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  areaTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  zipCodes: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: 8,
  },
  metaContainer: {
    gap: 2,
  },
  metaText: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  coverageCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coverageTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
    marginLeft: spacing.xs,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#558B2F',
    marginRight: spacing.sm,
  },
  coverageText: {
    fontSize: typography.fontSize.sm,
    color: '#33691E',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#00C853',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
});
