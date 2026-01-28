import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { riderApi } from '../../services/api';

interface Transaction {
  id: string;
  type?: 'earnings' | 'withdrawal' | 'bonus'; // Optional as backend might not return it yet
  description: string;
  amount: string | number;
  createdAt: string;
  orderId?: string;
  status?: string;
}

interface EarningsData {
  walletBalance: string;
  totalEarnings: string;
  periodEarnings: number;
  totalDeliveries: number;
  rating: string;
  transactions: Transaction[];
}

export default function RiderEarningsScreen() {
  const navigation = useNavigation<any>();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      // Calculate date range based on selectedPeriod
      const now = new Date();
      let startDate = new Date();
      
      if (selectedPeriod === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === 'week') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const response = await riderApi.getEarnings({ 
        startDate: startDate.toISOString() 
      });

      if (response.data && response.data.success) {
        setEarningsData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const getTransactionIcon = (type: string = 'earnings') => {
    switch (type) {
      case 'withdrawal': return 'arrow-up-circle';
      case 'bonus': return 'gift';
      default: return 'arrow-down-circle';
    }
  };

  const getTransactionColor = (type: string = 'earnings') => {
    switch (type) {
      case 'withdrawal': return colors.error;
      case 'bonus': return colors.warning;
      default: return colors.success;
    }
  };

  // Safe deduction of transactions with Unique Key enforcement
  const transactions = React.useMemo(() => {
    if (!earningsData?.transactions) return [];
    
    // Deduplicate by ID
    const seen = new Set();
    return earningsData.transactions.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [earningsData]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Fallbacks
  const walletBalance = Number(earningsData?.walletBalance || 0);
  const periodEarnings = Number(earningsData?.periodEarnings || 0);
  const totalDeliveries = earningsData?.totalDeliveries || 0;
  const avgPerDelivery = totalDeliveries > 0 ? (Number(earningsData?.totalEarnings || 0) / totalDeliveries) : 0;

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
            <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
            <Text style={styles.balanceSubtext}>{totalDeliveries} deliveries completed</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as const).map((p) => (
             <TouchableOpacity
              key={p}
              style={[styles.periodButton, selectedPeriod === p && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>${periodEarnings.toFixed(2)}</Text>
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
            <Text style={styles.statNumber}>{totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.statNumber}>${avgPerDelivery.toFixed(2)}</Text>
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

          {transactions.length === 0 ? (
             <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyText}>No transactions found for this period</Text>
             </View>
          ) : (
            transactions.map((transaction) => {
              const amount = Number(transaction.amount);
              const type = transaction.type || 'earnings';
              const date = new Date(transaction.createdAt).toLocaleString();

              return (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionCard}
                  onPress={() => {
                    if (transaction.orderId) {
                       // Try to navigate to order details if possible
                       // Or simple alert for now
                    }
                  }}
                >
                  <View 
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: `${getTransactionColor(type)}20` }
                    ]}
                  >
                    <Ionicons 
                      name={getTransactionIcon(type) as any} 
                      size={24} 
                      color={getTransactionColor(type)} 
                    />
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>{transaction.description}</Text>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>{date}</Text>
                    </View>
                  </View>
                  
                  <Text 
                    style={[
                      styles.transactionAmount,
                      { color: type === 'withdrawal' ? colors.error : colors.success }
                    ]}
                  >
                    {type === 'withdrawal' ? '-' : '+'}${amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  transactionAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center', 
    padding: 30,
    opacity: 0.7 
  },
  emptyText: {
    marginTop: 10,
    color: colors.textLight,
    fontStyle: 'italic'
  }
});

