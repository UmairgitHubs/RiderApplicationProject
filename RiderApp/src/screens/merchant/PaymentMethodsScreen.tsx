import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  cardType?: 'visa' | 'mastercard' | 'amex';
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
  holderName?: string;
}

import { useNavigation } from '@react-navigation/native';

export default function PaymentMethodsScreen() {
  const navigation = useNavigation<any>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'wallet',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      cardType: 'visa',
      last4: '4242',
      expiryDate: '12/25',
      holderName: 'John Doe',
      isDefault: false,
    },
    {
      id: '3',
      type: 'card',
      cardType: 'mastercard',
      last4: '8888',
      expiryDate: '06/26',
      holderName: 'John Doe',
      isDefault: false,
    },
  ]);

  const walletBalance = 450.75;

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    })));
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(method => method.id !== id));
          },
        },
      ]
    );
  };

  const handleAddNewCard = () => {
    Alert.alert('Coming Soon', 'Addition of new payment cards will be available in the next update.');
  };

  const getCardIcon = (cardType?: string) => {
    switch (cardType) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const getCardColor = (cardType?: string) => {
    switch (cardType) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return colors.textLight;
    }
  };

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
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>Manage your payment options</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Methods List */}
        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentCard}>
            {method.type === 'wallet' ? (
              // Wallet Card
              <View style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <View style={styles.walletIconContainer}>
                    <Ionicons name="wallet" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletLabel}>COD Express Wallet</Text>
                    <Text style={styles.walletBalance}>${walletBalance.toFixed(2)}</Text>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.walletActions}>
                  {!method.isDefault && (
                    <TouchableOpacity 
                      style={styles.walletActionButton}
                      onPress={() => handleSetDefault(method.id)}
                    >
                      <Text style={styles.walletActionText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.walletActionButton, styles.walletActionButtonPrimary]}
                    onPress={() => {
                      const parent = navigation.getParent();
                      if (parent) parent.navigate('Wallet');
                    }}
                  >
                    <Text style={styles.walletActionTextPrimary}>Add Money</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Credit Card
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View 
                      style={[
                        styles.cardIconContainer,
                        { backgroundColor: `${getCardColor(method.cardType)}20` }
                      ]}
                    >
                      <Ionicons 
                        name={getCardIcon(method.cardType) as any} 
                        size={28} 
                        color={getCardColor(method.cardType)} 
                      />
                    </View>
                    <View style={styles.cardDetails}>
                      <Text style={styles.cardType}>
                        {method.cardType?.toUpperCase()} •••• {method.last4}
                      </Text>
                      <Text style={styles.cardHolder}>{method.holderName}</Text>
                      <Text style={styles.cardExpiry}>Expires {method.expiryDate}</Text>
                    </View>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  {!method.isDefault && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(method.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                      <Text style={[styles.actionButtonText, { color: colors.success }]}>
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteMethod(method.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Add New Card Button */}
        <TouchableOpacity style={styles.addCardButton} onPress={handleAddNewCard}>
          <View style={styles.addCardIcon}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </View>
          <Text style={styles.addCardText}>Add New Card</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure Payments</Text>
            <Text style={styles.infoText}>
              All transactions are encrypted and secure. Your card details are never stored on our servers.
            </Text>
          </View>
        </View>

        {/* Supported Cards */}
        <View style={styles.supportedSection}>
          <Text style={styles.supportedTitle}>Supported Payment Methods</Text>
          <View style={styles.supportedCards}>
            <View style={styles.supportedCard}>
              <Ionicons name="card" size={24} color="#1A1F71" />
              <Text style={styles.supportedCardText}>Visa</Text>
            </View>
            <View style={styles.supportedCard}>
              <Ionicons name="card" size={24} color="#EB001B" />
              <Text style={styles.supportedCardText}>Mastercard</Text>
            </View>
            <View style={styles.supportedCard}>
              <Ionicons name="card" size={24} color="#006FCF" />
              <Text style={styles.supportedCardText}>Amex</Text>
            </View>
            <View style={styles.supportedCard}>
              <Ionicons name="wallet" size={24} color={colors.primary} />
              <Text style={styles.supportedCardText}>Wallet</Text>
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
  paymentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletCard: {
    gap: spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  walletBalance: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  walletActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  walletActionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  walletActionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  walletActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  walletActionTextPrimary: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  cardContent: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardDetails: {
    flex: 1,
  },
  cardType: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardHolder: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  cardExpiry: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  defaultText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.xl,
  },
  addCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addCardText: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  supportedSection: {
    marginBottom: spacing.lg,
  },
  supportedTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textLight,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  supportedCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  supportedCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  supportedCardText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
});

