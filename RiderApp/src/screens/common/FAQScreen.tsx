import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { cmsApi } from '../../services/api';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  title: string;
  content: string;
}

export default function FAQScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await cmsApi.getFAQs();
      if (response.success && response.data) {
        setFaqs(response.data);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedId === item.id;

    return (
      <View key={item.id} style={styles.faqCard}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.questionContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.questionText}>{item.title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{item.content}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.orangeHeader, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>FAQs</Text>
          <Text style={styles.headerSubtitle}>Frequently Asked Questions</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {faqs.length > 0 ? (
              faqs.map(renderFAQItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>No FAQs available at the moment.</Text>
              </View>
            )}
            
            {/* Contact Support Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Still have questions?</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => navigation.navigate('ChatSupport')}
              >
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
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
    paddingBottom: 30,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 1,
  },
  backButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20, // Overlap nicely with header
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textLight,
  },
  faqCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  questionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  answerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  answerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    color: colors.textLight,
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
  footerContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  footerText: {
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  contactButtonText: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
});
