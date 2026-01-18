import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FormField {
  id: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'date' | 'select';
  required?: boolean;
  icon?: string;
  value?: string;
  options?: { label: string; value: string }[];
}

interface FormScreenProps {
  navigation: any;
  route: {
    params: {
      title: string;
      subtitle?: string;
      fields: FormField[];
      onSubmit: (data: Record<string, any>) => void;
      buttonText?: string;
    };
  };
}

export default function FormScreen({ navigation, route }: FormScreenProps) {
  const { t } = useTranslation();
  const { title, subtitle, fields, onSubmit, buttonText = 'Save' } = route.params;
  
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.id] = field.value || '';
    });
    return initial;
  });

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSelectField = (field: FormField) => {
    const parent = navigation.getParent();
    if (parent && field.options) {
      parent.navigate('Selection', {
        title: field.label,
        options: field.options.map(opt => ({
          id: opt.value,
          label: opt.label,
          value: opt.value,
        })),
        type: 'single',
        selectedValues: formData[field.id] ? [formData[field.id]] : [],
        onSelect: (values: any[]) => {
          handleFieldChange(field.id, values[0]);
        },
      });
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    const missingFields = fields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in: ${missingFields.join(', ')}`
      );
      return;
    }

    onSubmit(formData);
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
        {fields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            
            {field.type === 'select' ? (
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => handleSelectField(field)}
              >
                {field.icon && (
                  <Ionicons
                    name={field.icon as any}
                    size={20}
                    color={colors.textLight}
                    style={styles.inputIcon}
                  />
                )}
                <Text
                  style={[
                    styles.selectText,
                    !formData[field.id] && styles.selectPlaceholder,
                  ]}
                >
                  {formData[field.id] || field.placeholder || 'Select an option'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textLight} />
              </TouchableOpacity>
            ) : (
              <View style={styles.inputContainer}>
                {field.icon && (
                  <Ionicons
                    name={field.icon as any}
                    size={20}
                    color={colors.textLight}
                    style={styles.inputIcon}
                  />
                )}
                <TextInput
                  style={[
                    styles.input,
                    field.type === 'textarea' && styles.textArea,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textLight}
                  value={formData[field.id]}
                  onChangeText={(value) => handleFieldChange(field.id, value)}
                  keyboardType={
                    field.type === 'email' ? 'email-address' :
                    field.type === 'phone' ? 'phone-pad' :
                    field.type === 'number' ? 'numeric' :
                    'default'
                  }
                  multiline={field.type === 'textarea'}
                  numberOfLines={field.type === 'textarea' ? 4 : 1}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
          <Text style={styles.submitButtonText}>{buttonText}</Text>
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
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  selectText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  selectPlaceholder: {
    color: colors.textLight,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
});



