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
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Transaction {
  id: string;
  type: 'debit' | 'credit' | 'refund';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  shipmentId?: string;
}

import { useNavigation } from '@react-navigation/native';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<'all' | 'credit' | 'debit'>('all');

  const balance = 450.75;
  const totalEarnings = 2580.50;
  const totalSpent = 2129.75;

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'debit',
      description: 'Shipment CE2024001234567',
      amount: 45.99,
      date: 'Today, 10:30 AM',
      status: 'completed',
      shipmentId: 'CE2024001234567',
    },
    {
      id: '2',
      type: 'credit',
      description: 'Wallet Top-up',
      amount: 200.00,
      date: 'Yesterday, 3:45 PM',
      status: 'completed',
    },
    {
      id: '3',
      type: 'debit',
      description: 'Shipment CE2024001234568',
      amount: 25.00,
      date: 'Dec 28, 2024',
      status: 'completed',
      shipmentId: 'CE2024001234568',
    },
    {
      id: '4',
      type: 'refund',
      description: 'Refund for CE2024001234560',
      amount: 30.50,
      date: 'Dec 27, 2024',
      status: 'completed',
      shipmentId: 'CE2024001234560',
    },
    {
      id: '5',
      type: 'debit',
      description: 'Shipment CE2024001234569',
      amount: 18.50,
      date: 'Dec 26, 2024',
      status: 'pending',
      shipmentId: 'CE2024001234569',
    },
  ];

  const filteredTransactions = transactions.filter(t => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'credit') return t.type === 'credit' || t.type === 'refund';
    if (selectedTab === 'debit') return t.type === 'debit';
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'arrow-down-circle';
      case 'debit':
        return 'arrow-up-circle';
      case 'refund':
        return 'refresh-circle';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return colors.success;
      case 'debit':
        return colors.error;
      case 'refund':
        return colors.info;
      default:
        return colors.textLight;
    }
  };

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header */}
      <View style={styles.orangeHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Wallet</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconContainer}>
            <Ionicons name="wallet" size={32} color={colors.primary} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="arrow-down" size={20} color={colors.success} />
            <Text style={styles.statLabel}>Earned</Text>
            <Text style={styles.statValue}>${totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="arrow-up" size={20} color={colors.error} />
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('ComingSoon', {
                  featureName: 'Add Money',
                  description: 'Add money to your wallet using credit/debit cards or bank transfer. Payment gateway integration coming soon!'
                });
              }
            }}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="add" size={24} color={colors.success} />
            </View>
            <Text style={styles.actionButtonText}>Add Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('ComingSoon', {
                  featureName: 'Send Money',
                  description: 'Send money to other users instantly. Coming soon!'
                });
              }
            }}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="send" size={24} color={colors.info} />
            </View>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('ComingSoon', {
                  featureName: 'Withdraw Money',
                  description: 'Withdraw funds to your bank account. Coming soon!'
                });
              }
            }}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="card" size={24} color={colors.warning} />
            </View>
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'credit' && styles.tabActive]}
            onPress={() => setSelectedTab('credit')}
          >
            <Text style={[styles.tabText, selectedTab === 'credit' && styles.tabTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'debit' && styles.tabActive]}
            onPress={() => setSelectedTab('debit')}
          >
            <Text style={[styles.tabText, selectedTab === 'debit' && styles.tabTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredTransactions.map((transaction) => (
            <TouchableOpacity 
              key={transaction.id} 
              style={styles.transactionCard}
              onPress={() => {
                if (transaction.shipmentId) {
                  const parent = navigation.getParent();
                  if (parent) parent.navigate('ShipmentDetails', { trackingId: transaction.shipmentId });
                }
              }}
            >
              <View 
                style={[
                  styles.transactionIcon,
                  { backgroundColor: `${getTransactionColor(transaction.type)}20` }
                ]}
              >
                <Ionicons 
                  name={getTransactionIcon(transaction.type) as any} 
                  size={24} 
                  color={getTransactionColor(transaction.type)} 
                />
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                  {transaction.status === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <Text 
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'debit' ? colors.error : colors.success }
                ]}
              >
                {transaction.type === 'debit' ? '-' : '+'}${transaction.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: colors.textWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.md,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    opacity: 0.9,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  transactionsSection: {
    marginBottom: spacing.lg,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  transactionAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});

