import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending';
  icon: string;
}

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('EasyPaisa');

  // Mock Data matching screenshot style
  const balance = 5500;
  const totalSpent = 402.49;
  const pending = 95.5;

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'debit',
      title: 'Shipment',
      subtitle: 'SS24001234567',
      date: '11/19/2025',
      amount: 250,
      status: 'completed',
      icon: 'arrow-top-right'
    },
    {
      id: '2',
      type: 'credit',
      title: 'Wallet Top-up',
      subtitle: '',
      date: '11/18/2025',
      amount: 3000,
      status: 'completed',
      icon: 'arrow-bottom-left'
    },
    {
      id: '3',
      type: 'debit',
      title: 'Shipment',
      subtitle: 'SS24009876543',
      date: '11/15/2025',
      amount: 150.50,
      status: 'completed',
      icon: 'arrow-top-right'
    },
  ];

  const handleAddFunds = () => {
    // Logic to process add funds would go here
    setModalVisible(false);
    setAddAmount('');
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 30) }]}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Text style={styles.headerSubtitle}>Manage your payments</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Dark Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeaderRow}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>Rs. {balance.toLocaleString()}</Text>
            </View>
            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="white" />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.balanceStatsRow}>
            <View>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>Rs. {totalSpent}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>Rs. {pending}</Text>
            </View>
          </View>
        </View>

        {/* 3. Action Buttons Grid */}
        <View style={styles.actionsGrid}>
          {/* Add Funds */}
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => setModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="add" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Add Funds</Text>
          </TouchableOpacity>

          {/* Payment Methods */}
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PaymentMethods')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="card-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.actionText}>Payment Methods</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <MaterialCommunityIcons name="history" size={20} color="#555" />
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        {transactions.map((t) => (
          <View key={t.id} style={styles.transactionItem}>
            {/* Icon */}
            <View style={[
              styles.transIconContainer, 
              { backgroundColor: t.type === 'debit' ? '#FFEBEE' : '#E8F5E9' }
            ]}>
              <MaterialCommunityIcons 
                name={t.icon as any} 
                size={20} 
                color={t.type === 'debit' ? '#D32F2F' : '#388E3C'} 
              />
            </View>

            {/* Details */}
            <View style={styles.transDetails}>
              <Text style={styles.transTitle}>{t.title}</Text>
              {t.subtitle ? <Text style={styles.transSubtitle}>{t.subtitle}</Text> : null}
              <Text style={styles.transDate}>{t.date}</Text>
            </View>

            {/* Amount & Status */}
            <View style={styles.transRight}>
              <Text style={[
                styles.transAmount,
                { color: t.type === 'debit' ? '#D32F2F' : '#388E3C' }
              ]}>
                {t.type === 'debit' ? '-' : '+'}Rs. {t.amount}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: t.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: t.status === 'completed' ? '#388E3C' : '#F57C00' }
                ]}>
                  {t.status}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Spacer for bottom tabs */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Funds Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
              >
                <Text style={styles.modalTitle}>Add Funds</Text>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (Rs.)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={addAmount}
                    onChangeText={setAddAmount}
                  />
                </View>

                {/* Preset Chips */}
                <View style={styles.presetRow}>
                  {[500, 1000, 2000].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.presetChip}
                      onPress={() => setAddAmount(amount.toString())}
                    >
                      <Text style={styles.presetText}>Rs. {amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Payment Method */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <TouchableOpacity style={styles.methodSelector}>
                    <Text style={styles.methodText}>{selectedMethod}</Text>
                  </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.addFundsButton}
                    onPress={handleAddFunds}
                  >
                    <Text style={styles.addFundsButtonText}>Add Funds</Text>
                  </TouchableOpacity>
                </View>

              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC', // Very light grey bg
  },
  header: {
    backgroundColor: '#F26E21', // Orange Header
    paddingHorizontal: 24,
    paddingBottom: 80, // Space for the floating card
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    marginTop: -60, // Pull up to overlap header
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Balance Card
  balanceCard: {
    backgroundColor: '#1A2138', // Dark Navy/Black for premium look
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#8A94A6',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  balanceStatsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  statLabel: {
    color: '#8A94A6',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    height: 140, // Square-ish look
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18, // Soft square
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // Transactions
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  transIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transDetails: {
    flex: 1,
  },
  transTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  transDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transRight: {
    alignItems: 'flex-end',
  },
  transAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 14,
  },
  methodSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
  },
  methodText: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  addFundsButton: {
    flex: 1,
    backgroundColor: '#F26E21',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addFundsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

