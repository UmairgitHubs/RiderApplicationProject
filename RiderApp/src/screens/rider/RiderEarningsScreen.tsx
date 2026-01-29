import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { riderApi } from '../../services/api';

const { width } = Dimensions.get('window');

// --- Types ---

interface Transaction {
  id: string;
  type: 'earnings' | 'withdrawal';
  amount: string | number;
  description: string;
  createdAt: string;
  status?: string;
}

interface EarningsData {
  walletBalance: string | number;
  totalEarnings: string | number;
  pendingAmount: string | number;
  earningsToday: number;
  deliveriesToday: number;
  earningsWeek: number;
  deliveriesWeek: number;
  earningsMonth: number;
  deliveriesMonth: number;
  avgPerOrder: number;
  transactions: Transaction[];
}

// --- Sub-Components (Internal for simplicity per file) ---

const StatCard = ({ label, value, subtext, icon, color, bg }: any) => (
  <View style={styles.gridItem}>
    <View style={[styles.iconContainer, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue}>${Number(value).toFixed(2)}</Text>
    <Text style={styles.cardSubtext}>{subtext}</Text>
  </View>
);

const HistoryItem = ({ item, isWithdrawal }: { item: Transaction, isWithdrawal: boolean }) => {
    const iconName = isWithdrawal ? "arrow-forward" : "cube-outline";
    const iconColor = isWithdrawal ? "#2196F3" : "#4CAF50"; // Blue vs Green
    const iconBg = isWithdrawal ? "#E3F2FD" : "#E8F5E9";
    const amountPrefix = isWithdrawal ? "-" : "+";
    const amountColor = isWithdrawal ? "#2196F3" : "#4CAF50";

    return (
        <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
            <View style={styles.historyDetails}>
                <Text style={styles.historyId}>{item.description || (isWithdrawal ? 'Withdrawal' : 'Delivery Earnings')}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.historyMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    {item.status && (
                        <Text style={[
                            styles.statusTag, 
                            item.status === 'pending' ? { color: colors.warning } : { color: colors.textLight }
                        ]}>
                             • {item.status}
                        </Text>
                    )}
                </View>
            </View>
            <Text style={[styles.historyAmount, { color: amountColor }]}>
                {amountPrefix}${Number(item.amount).toFixed(2)}
            </Text>
        </View>
    );
};

// --- Main Component ---

export default function RiderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<EarningsData | null>(null);

  // Withdrawal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // --- Data Fetching ---

  const fetchEarnings = async () => {
    try {
      console.log('Fetching earnings...');
      const response = await riderApi.getEarnings({});
      console.log('Earnings Response:', JSON.stringify(response, null, 2));
      
      // Fix: Check response.success directly, not response.data.success
      if (response && response.success) {
        setData(response.data);
      } else {
        console.warn('Earnings fetch failed or returned no success flag', response);
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEarnings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  // --- Handlers ---

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    const balance = Number(data?.walletBalance || 0);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (amount > balance) {
      Alert.alert('Insufficient Funds', 'You cannot withdraw more than your available balance.');
      return;
    }

    if (amount < 10) { 
        Alert.alert('Minimum Withdrawal', 'The minimum withdrawal amount is $10.00');
        return;
    }

    try {
      setIsWithdrawing(true);
      const response = await riderApi.withdrawEarnings({
        amount: amount,
        method: 'bank_transfer',
        accountDetails: 'Saved Bank Account' 
      });

      if (response && response.success) {
        Alert.alert('Success', 'Withdrawal request submitted successfully.', [
           { text: 'OK', onPress: () => {
               setWithdrawModalVisible(false);
               setWithdrawAmount('');
               onRefresh(); // Refresh data to update balance
           }}
        ]);
      } else {
         throw new Error(response?.error?.message || 'Withdrawal request failed.');
      }
    } catch (error: any) {
       // Graceful handling if backend isn't reachable or other error
       const msg = error.message || 'Failed to submit withdrawal.';
       Alert.alert('Error', msg);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // --- Memoized Data ---

  const walletBalance = useMemo(() => Number(data?.walletBalance || 0), [data]);
  const totalEarned = useMemo(() => Number(data?.totalEarnings || 0), [data]);
  const pendingAmount = useMemo(() => Number(data?.pendingAmount || 0), [data]);

  const stats = useMemo(() => [
    {
      label: 'Today',
      value: data?.earningsToday || 0,
      subtext: `${data?.deliveriesToday || 0} deliveries`,
      icon: 'time',
      color: '#4CAF50',
      bg: '#E8F5E9'
    },
    {
      label: 'This Week',
      value: data?.earningsWeek || 0,
      subtext: `${data?.deliveriesWeek || 0} deliveries`,
      icon: 'calendar',
      color: '#2196F3',
      bg: '#E3F2FD'
    },
    {
      label: 'This Month',
      value: data?.earningsMonth || 0,
      subtext: `${data?.deliveriesMonth || 0} deliveries`,
      icon: 'stats-chart',
      color: '#9C27B0',
      bg: '#F3E5F5'
    },
    {
      label: 'Avg/Order',
      value: data?.avgPerOrder || 0,
      subtext: 'Per order',
      icon: 'calculator',
      color: '#FF9800',
      bg: '#FFF3E0'
    }
  ], [data]);

  const earningsHistory = useMemo(() => 
    data?.transactions?.filter(t => t.type !== 'withdrawal') || [], 
  [data]); // Note: Adjusted filter logic, non-withdrawals are earnings usually

  const withdrawalHistory = useMemo(() => 
    data?.transactions?.filter(t => t.description?.toLowerCase().includes('withdraw') || t.type === 'withdrawal') || [], 
  [data]);

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        {/* Header Background */}
        <View style={[styles.headerBg, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Earnings</Text>
            <Text style={styles.headerSubtitle}>Track your income</Text>
          </View>
        </View>

        {/* Balance Card - Overlapping */}
        <View style={styles.balanceCardWrapper}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.balanceIconBg}>
                <Ionicons name="wallet-outline" size={20} color="#FFF" />
              </View>
            </View>
            <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
            
            <View style={styles.balanceFooter}>
              <View>
                <Text style={styles.footerLabel}>Total Earned</Text>
                <Text style={styles.footerValue}>${totalEarned.toFixed(2)}</Text>
              </View>
              <View>
                <Text style={styles.footerLabel}>Pending</Text>
                <Text style={styles.footerValue}>${pendingAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.gridContainer}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => setWithdrawModalVisible(true)}
             activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="arrow-up" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Bank management will be available shortly.')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="business" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.actionText}>Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {earningsHistory.length === 0 ? (
             <Text style={styles.emptyText}>No recent earnings</Text>
          ) : (
            earningsHistory.map((item, index) => (
                <HistoryItem key={item.id} item={item} isWithdrawal={false} />
            ))
          )}
        </View>

        {/* Withdrawal History */}
        {withdrawalHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Withdrawal History</Text>
              {withdrawalHistory.map((item, index) => (
                  <HistoryItem key={item.id} item={item} isWithdrawal={true} />
              ))}
            </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={withdrawModalVisible}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalWrapper}>
                <TouchableWithoutFeedback onPress={() => setWithdrawModalVisible(false)}>
                    <View style={styles.modalBackdrop} />
                </TouchableWithoutFeedback>
                
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.modalKeyboardAvoid}
                >
                  <View style={styles.modalContent}>
                    
                    <View style={styles.modalIndicator} />
                    <Text style={styles.modalTitle}>Withdraw Earnings</Text>

                    {/* Available Balance Card within Modal */}
                    <View style={styles.modalBalanceCard}>
                        <Text style={styles.modalBalanceLabel}>Available Balance</Text>
                        <Text style={styles.modalBalanceValue}>${walletBalance.toFixed(2)}</Text>
                    </View>

                    {/* Amount Input */}
                    <Text style={styles.inputLabel}>Amount ($)</Text>
                    <TextInput 
                        style={styles.amountInput}
                        value={withdrawAmount}
                        onChangeText={setWithdrawAmount}
                        placeholder="0.00"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                    />

                    {/* Quick Amount Buttons */}
                    <View style={styles.quickAmounts}>
                        {[50, 100, 200].map((amt) => (
                            <TouchableOpacity 
                                key={amt} 
                                style={[styles.quickAmountBtn, String(amt) === withdrawAmount && styles.quickAmountBtnActive]}
                                onPress={() => setWithdrawAmount(amt.toString())}
                            >
                                <Text style={[styles.quickAmountText, String(amt) === withdrawAmount && styles.quickAmountTextActive]}>${amt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Withdrawal Method */}
                    <Text style={styles.inputLabel}>Withdrawal Method</Text>
                    <View style={styles.methodInput}>
                        <Text style={styles.methodText}>Bank Account (**** 1234)</Text>
                        <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                    </View>

                    {/* Processing Time Note */}
                    <View style={styles.noteContainer}>
                        <Text style={styles.noteText}>Processing time: 2-3 business days</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity 
                            style={styles.cancelBtn} 
                            onPress={() => setWithdrawModalVisible(false)}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.withdrawBtn}
                            onPress={handleWithdrawSubmit}
                            disabled={isWithdrawing}
                        >
                            {isWithdrawing ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.withdrawBtnText}>Withdraw</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                  </View>
                </KeyboardAvoidingView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light Gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  headerBg: {
    backgroundColor: colors.primary,
    paddingBottom: 80, // Space specifically for overlap
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceCardWrapper: {
    marginTop: -60,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    backgroundColor: '#1E293B', // Dark Navy
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  footerLabel: {
    color: '#94A3B8', // Slate 400
    fontSize: 11,
    marginBottom: 4,
  },
  footerValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: 12,
    marginBottom: spacing.xl,
  },
  gridItem: {
    width: (width - (spacing.lg * 2) - 12) / 2, // Calculate width for 2 columns with gap
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 12,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    marginLeft: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalKeyboardAvoid: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: spacing.lg,
  },
  modalBalanceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: spacing.lg,
  },
  modalBalanceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  modalBalanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickAmountBtnActive: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  quickAmountTextActive: {
      color: colors.primary,
  },
  methodInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  methodText: {
    fontSize: 14,
    color: '#1E293B',
  },
  noteContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: spacing.xl,
  },
  noteText: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  withdrawBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
