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
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Transaction {
  id: string;
  type: 'earnings' | 'withdrawal' | 'bonus';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  orderId?: string;
}

export default function RiderEarningsScreen() {
  const navigation = useNavigation<any>();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const earnings = {
    available: 580.50,
    today: 125.50,
    thisWeek: 580.50,
    thisMonth: 2345.75,
    totalDeliveries: 42,
    avgPerDelivery: 13.82,
  };

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'earnings',
      description: 'Delivery #CE2024001234567',
      amount: 45.99,
      date: 'Today, 10:30 AM',
      status: 'completed',
      orderId: 'CE2024001234567',
    },
    {
      id: '2',
      type: 'earnings',
      description: 'Delivery #CE2024001234568',
      amount: 25.00,
      date: 'Today, 09:15 AM',
      status: 'completed',
      orderId: 'CE2024001234568',
    },
    {
      id: '3',
      type: 'bonus',
      description: 'Peak Hours Bonus',
      amount: 15.00,
      date: 'Today, 08:00 AM',
      status: 'completed',
    },
    {
      id: '4',
      type: 'earnings',
      description: 'Delivery #CE2024001234569',
      amount: 39.51,
      date: 'Yesterday, 6:45 PM',
      status: 'completed',
      orderId: 'CE2024001234569',
    },
    {
      id: '5',
      type: 'withdrawal',
      description: 'Bank Transfer',
      amount: 200.00,
      date: 'Dec 28, 2024',
      status: 'pending',
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earnings':
        return 'arrow-down-circle';
      case 'withdrawal':
        return 'arrow-up-circle';
      case 'bonus':
        return 'gift';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earnings':
        return colors.success;
      case 'withdrawal':
        return colors.error;
      case 'bonus':
        return colors.warning;
      default:
        return colors.textLight;
    }
  };

  const getCurrentPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.thisWeek;
      case 'month':
        return earnings.thisMonth;
      default:
        return earnings.today;
    }
  };

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header */}
      <View style={styles.orangeHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Earnings</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available to Withdraw</Text>
            <Text style={styles.balanceAmount}>${earnings.available.toFixed(2)}</Text>
            <Text style={styles.balanceSubtext}>{earnings.totalDeliveries} deliveries completed</Text>
          </View>
          <TouchableOpacity 
            style={styles.withdrawButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('ComingSoon', {
                  featureName: 'Withdraw Earnings',
                  description: 'Withdraw your earnings to your bank account. Banking integration coming soon!'
                });
              }
            }}
          >
            <Ionicons name="wallet" size={20} color={colors.textWhite} />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'today' && styles.periodTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>${getCurrentPeriodEarnings().toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>
            {selectedPeriod === 'today' ? 'Today\'s Earnings' : 
             selectedPeriod === 'week' ? 'This Week\'s Earnings' : 
             'This Month\'s Earnings'}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{earnings.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.statNumber}>${earnings.avgPerDelivery.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg/Delivery</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => (
            <TouchableOpacity 
              key={transaction.id} 
              style={styles.transactionCard}
              onPress={() => {
                if (transaction.orderId) {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate('RiderOrderDetails', { orderId: transaction.orderId });
                  }
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
                  { color: transaction.type === 'withdrawal' ? colors.error : colors.success }
                ]}
              >
                {transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={colors.warning} />
            <Text style={styles.tipsTitle}>Earning Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>Complete deliveries during peak hours for bonuses</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>Maintain high ratings to unlock premium orders</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>Complete 10+ deliveries daily for extra rewards</Text>
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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  balanceInfo: {
    marginBottom: spacing.md,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  balanceSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    opacity: 0.8,
  },
  withdrawButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textWhite,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  withdrawButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },
  periodTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
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
  tipsCard: {
    backgroundColor: '#FFF9F0',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});

