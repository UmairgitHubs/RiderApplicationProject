import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface SelectionOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  value: any;
}

interface SelectionScreenProps {
  navigation: any;
  route: {
    params: {
      title: string;
      subtitle?: string;
      options: SelectionOption[];
      type: 'single' | 'multiple';
      selectedValues?: any[];
      onSelect: (values: any[]) => void;
      buttonText?: string;
    };
  };
}

export default function SelectionScreen({ navigation, route }: SelectionScreenProps) {
  const { t } = useTranslation();
  const { title, subtitle, options, type, selectedValues: initialValues = [], onSelect, buttonText = 'Continue' } = route.params;
  
  const [selectedValues, setSelectedValues] = useState<any[]>(initialValues);

  const handleToggle = (value: any) => {
    if (type === 'single') {
      setSelectedValues([value]);
    } else {
      setSelectedValues(prev => {
        if (prev.includes(value)) {
          return prev.filter(v => v !== value);
        } else {
          return [...prev, value];
        }
      });
    }
  };

  const handleContinue = () => {
    if (selectedValues.length === 0) {
      return;
    }
    onSelect(selectedValues);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        )}

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
              onPress={() => handleToggle(option.value)}
            >
              <View style={styles.optionLeft}>
                {option.icon && (
                  <View style={[
                    styles.optionIconContainer,
                    isSelected && styles.optionIconContainerSelected,
                  ]}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? colors.textWhite : colors.primary}
                    />
                  </View>
                )}
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={[
                      styles.optionDescription,
                      isSelected && styles.optionDescriptionSelected,
                    ]}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}>
                {isSelected && (
                  <Ionicons
                    name={type === 'single' ? 'radio-button-on' : 'checkmark'}
                    size={20}
                    color={colors.textWhite}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedValues.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedValues.length === 0}
        >
          <Text style={styles.continueButtonText}>{buttonText}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
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
  header: {
    backgroundColor: colors.success,
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
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: colors.success,
    backgroundColor: colors.backgroundLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconContainerSelected: {
    backgroundColor: colors.success,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionLabelSelected: {
    color: colors.success,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  optionDescriptionSelected: {
    color: colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
});



