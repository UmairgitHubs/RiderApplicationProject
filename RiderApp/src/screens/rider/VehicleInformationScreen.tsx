import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVehicle } from '../../hooks/useVehicle';

// --- Interfaces ---
// Moved to hook file or kept local if purely view specific
interface AddVehicleFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; number: string; model: string }) => Promise<void>;
  loading: boolean;
}

// --- Constants ---
const HEADER_HEIGHT = 120;

// --- Sub-components ---

const AddVehicleModal: React.FC<AddVehicleFormProps> = ({ visible, onClose, onSubmit, loading }) => {
  const [model, setModel] = useState('');
  const [number, setNumber] = useState('');
  const [type, setType] = useState('Bike'); // Default

  const handleSubmit = () => {
    if (!model.trim() || !number.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    onSubmit({ type, number, model });
    // Reset form handled by parent or effect
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vehicle</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
               <Text style={styles.label}>Vehicle Type</Text>
               <View style={styles.typeSelector}>
                 <TouchableOpacity 
                    style={[styles.typeOption, type === 'Bike' && styles.typeOptionSelected]}
                    onPress={() => setType('Bike')}
                 >
                    <Ionicons name="bicycle" size={20} color={type === 'Bike' ? '#fff' : colors.text} />
                    <Text style={[styles.typeText, type === 'Bike' && styles.typeTextSelected]}>Bike</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                    style={[styles.typeOption, type === 'Car' && styles.typeOptionSelected]}
                    onPress={() => setType('Car')}
                 >
                    <Ionicons name="car-outline" size={20} color={type === 'Car' ? '#fff' : colors.text} />
                    <Text style={[styles.typeText, type === 'Car' && styles.typeTextSelected]}>Car</Text>
                 </TouchableOpacity>
               </View>

               <Text style={styles.label}>Vehicle Model</Text>
               <TextInput
                 style={styles.input}
                 placeholder="e.g. Honda CD 70 2023"
                 value={model}
                 onChangeText={setModel}
               />

               <Text style={styles.label}>Vehicle Number (Plate)</Text>
               <TextInput
                 style={styles.input}
                 placeholder="e.g. ABC-123"
                 value={number}
                 onChangeText={setNumber}
                 autoCapitalize="characters"
               />
            </View>

            <TouchableOpacity 
              style={styles.modalSubmitButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>Add Vehicle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Main Screen ---

export default function VehicleInformationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Custom Hook for Data & Logic
  const { 
    vehicle, 
    isLoading, 
    refetch, 
    addVehicle, 
    isAdding, 
    deleteVehicle, 
    isDeleting 
  } = useVehicle();

  // Local UI State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handlers
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddVehicle = async (data: { type: string; number: string; model: string }) => {
    try {
      await addVehicle(data);
      setIsModalVisible(false);
      Alert.alert('Success', 'Vehicle added successfully');
    } catch (error) {
      // Error handled in hook/mutation onError
    }
  };

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to remove this vehicle? You wont be able to accept orders.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteVehicle();
              Alert.alert('Removed', 'Vehicle removed successfully');
            } catch (error) {
              // Error handled in hook/mutation onError
            }
          } 
        }
      ]
    );
  };

  const handleUploadDocuments = () => {
    Alert.alert(
      'Upload Documents', 
      'Document upload feature is coming in the next update. Please ensure you have physical copies ready for verification at the Hub.'
    );
  };

  // View
  if (isLoading && !vehicle) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vehicle Information</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
        }
      >
        {vehicle ? (
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconContainer}>
                <Ionicons 
                  name={vehicle.type === 'Car' ? "car-sport" : "bicycle"} 
                  size={28} 
                  color="#2196F3" 
                />
              </View>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleType}>{vehicle.type}</Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>{vehicle.status}</Text>
                  </View>
                </View>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                <Text style={styles.vehicleDetails}>
                   {vehicle.number} • {vehicle.color}
                </Text>
              </View>
              <TouchableOpacity onPress={handleDeleteVehicle} disabled={isDeleting} style={styles.deleteButton}>
                {isDeleting ? <ActivityIndicator size="small" color="#F44336" /> : <Ionicons name="trash-outline" size={20} color="#F44336" />}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No vehicle assigned</Text>
          </View>
        )}

        <TouchableOpacity 
           style={styles.addVehicleButton} 
           onPress={() => {
             if (vehicle) {
               Alert.alert('Replace Vehicle', 'Adding a new vehicle will replace the current one. Continue?', [
                 { text: 'Cancel', style: 'cancel' },
                 { text: 'Continue', onPress: () => setIsModalVisible(true) }
               ]);
             } else {
               setIsModalVisible(true);
             }
           }}
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text style={styles.addVehicleText}>Add New Vehicle</Text>
        </TouchableOpacity>

        {/* Required Documents */}
        <View style={styles.documentsCard}>
          <Text style={styles.documentsTitle}>Required Documents</Text>
          
          {[
            'Vehicle registration certificate',
            'Valid insurance policy',
            'Roadworthiness certificate'
          ].map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.documentText}>{doc}</Text>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUploadDocuments}
          >
            <Text style={styles.uploadButtonText}>Upload Documents</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal */}
      <AddVehicleModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleAddVehicle}
        loading={isAdding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: spacing.md,
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    bottom: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: typography.fontSize['xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  activeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vehicleModel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: 2,
  },
  vehicleDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  deleteButton: {
    padding: spacing.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.full,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateText: {
    marginTop: spacing.sm,
    color: colors.textLight,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    elevation: 1,
  },
  addVehicleText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  documentsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  documentsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#1565C0',
    marginBottom: spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1976D2',
    marginRight: spacing.sm,
  },
  documentText: {
    fontSize: typography.fontSize.sm,
    color: '#0D47A1',
    opacity: 0.8,
  },
  uploadButton: {
    backgroundColor: '#1976D2',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  modalBody: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  typeOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeText: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  typeTextSelected: {
    color: '#fff',
  },
  modalSubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
