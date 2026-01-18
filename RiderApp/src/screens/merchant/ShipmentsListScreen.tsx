import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Shipment {
  id: string;
  trackingId: string;
  recipient: string;
  address: string;
  item: string;
  price: number;
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  date: string;
}

import { useNavigation, useRoute } from '@react-navigation/native';

export default function ShipmentsListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialFilter = (route.params as any)?.initialFilter || 'all';
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in-transit' | 'delivered'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const shipments: Shipment[] = [
    {
      id: '1',
      trackingId: 'CE2024001234567',
      recipient: 'Sarah Johnson',
      address: '456 Park Ave, Brooklyn, NY 11201',
      item: 'Electronics',
      price: 45.99,
      status: 'in-transit',
      date: 'Dec 1, 2024',
    },
    {
      id: '2',
      trackingId: 'CE2024001234568',
      recipient: 'Michael Chen',
      address: '789 5th Avenue, Manhattan, NY 10022',
      item: 'Documents',
      price: 25.00,
      status: 'pending',
      date: 'Dec 1, 2024',
    },
    {
      id: '3',
      trackingId: 'CE2024001234569',
      recipient: 'Emily Davis',
      address: '321 Madison Ave, New York, NY 10017',
      item: 'Clothing',
      price: 18.50,
      status: 'delivered',
      date: 'Nov 30, 2024',
    },
    {
      id: '4',
      trackingId: 'CE2024001234570',
      recipient: 'John Smith',
      address: '123 Broadway, Manhattan, NY 10001',
      item: 'Books',
      price: 30.00,
      status: 'delivered',
      date: 'Nov 29, 2024',
    },
    {
      id: '5',
      trackingId: 'CE2024001234571',
      recipient: 'Lisa Anderson',
      address: '555 West St, Brooklyn, NY 11201',
      item: 'Food & Beverages',
      price: 15.75,
      status: 'cancelled',
      date: 'Nov 28, 2024',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'in-transit':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Pickup';
      case 'in-transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesFilter = selectedFilter === 'all' || shipment.status === selectedFilter;
    const matchesSearch = 
      shipment.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFilterCount = (filter: string) => {
    if (filter === 'all') return shipments.length;
    return shipments.filter(s => s.status === filter).length;
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
          <Text style={styles.title}>All Shipments</Text>
          <Text style={styles.subtitle}>{shipments.length} total shipments</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by tracking ID or recipient"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={selectedFilter === 'all' ? colors.textWhite : colors.text} 
            />
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All ({getFilterCount('all')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'pending' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Ionicons 
              name="time" 
              size={16} 
              color={selectedFilter === 'pending' ? colors.textWhite : colors.warning} 
            />
            <Text style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}>
              Pending ({getFilterCount('pending')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'in-transit' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('in-transit')}
          >
            <Ionicons 
              name="bicycle" 
              size={16} 
              color={selectedFilter === 'in-transit' ? colors.textWhite : colors.info} 
            />
            <Text style={[styles.filterText, selectedFilter === 'in-transit' && styles.filterTextActive]}>
              In Transit ({getFilterCount('in-transit')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'delivered' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('delivered')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={selectedFilter === 'delivered' ? colors.textWhite : colors.success} 
            />
            <Text style={[styles.filterText, selectedFilter === 'delivered' && styles.filterTextActive]}>
              Delivered ({getFilterCount('delivered')})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Shipments List */}
        {filteredShipments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No shipments found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Create a new shipment to get started'}
            </Text>
          </View>
        ) : (
          filteredShipments.map((shipment) => (
            <TouchableOpacity 
              key={shipment.id} 
              style={styles.shipmentCard}
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) parent.navigate('ShipmentDetails', { trackingId: shipment.trackingId });
              }}
            >
              <View style={styles.shipmentHeader}>
                <View style={styles.shipmentHeaderLeft}>
                  <Ionicons name="cube" size={20} color={colors.primary} />
                  <Text style={styles.trackingId}>{shipment.trackingId}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipment.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(shipment.status)}</Text>
                </View>
              </View>

              <View style={styles.shipmentContent}>
                <View style={styles.recipientRow}>
                  <Ionicons name="person-outline" size={16} color={colors.textLight} />
                  <Text style={styles.recipient}>{shipment.recipient}</Text>
                </View>

                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textLight} />
                  <Text style={styles.address} numberOfLines={1}>{shipment.address}</Text>
                </View>

                <View style={styles.shipmentFooter}>
                  <View style={styles.itemRow}>
                    <Ionicons name="pricetag-outline" size={16} color={colors.textLight} />
                    <Text style={styles.item}>{shipment.item}</Text>
                  </View>
                  <Text style={styles.price}>${shipment.price.toFixed(2)}</Text>
                </View>

                <Text style={styles.date}>{shipment.date}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          const parent = navigation.getParent();
          if (parent) parent.navigate('CreateShipment');
        }}
      >
        <Ionicons name="add" size={28} color={colors.textWhite} />
      </TouchableOpacity>
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
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginBottom: spacing.lg,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
    color: colors.textWhite,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    paddingVertical: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  filtersScrollView: {
    maxHeight: 60,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  shipmentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shipmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  shipmentContent: {
    gap: spacing.sm,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipient: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    flex: 1,
  },
  shipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  item: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

