import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { profileApi, authApi } from '../../services/api';

export default function PrivacySecurityScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // Loading States
  const [loading, setLoading] = useState(true);
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(false); // Mapped to notifSystemUpdates

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Fetch initial settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response: any = await profileApi.getProfile();
      if (response.success && response.data?.profile) {
        const p = response.data.profile;
        setTwoFactorAuth(p.twoFactorEnabled ?? false);
        setLoginAlerts(p.notifSystemUpdates ?? false); 
        setEmailNotifications(p.emailNotifications ?? true);
        setSmsAlerts(p.smsNotifications ?? false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match');
      return;
    }

    try {
      setUpdatingPassword(true);
      const response: any = await profileApi.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        Alert.alert('Success', 'Password updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to update password. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      Alert.alert('Error', error.message || 'Failed to update password. Please check your current password and try again.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    const originalValue = twoFactorAuth;
    setTwoFactorAuth(value); // Optimistic update
    try {
        const response: any = await profileApi.toggleTwoFactor(value);
        if (!response.success) {
            setTwoFactorAuth(originalValue);
            Alert.alert('Error', 'Failed to update 2FA settings');
        }
    } catch (error) {
        setTwoFactorAuth(originalValue);
        Alert.alert('Error', 'Failed to update 2FA settings');
    }
  };

  const handleToggleLoginAlerts = async (value: boolean) => {
      // Maps to System Updates for now
      const original = loginAlerts;
      setLoginAlerts(value);
      try {
          // Explicitly casting or checking API payload in api.ts
          // updateProfile accepts notifSystemUpdates
          const response: any = await profileApi.updateProfile({ notifSystemUpdates: value });
          if (!response.success) setLoginAlerts(original);
      } catch (e) {
          setLoginAlerts(original);
      }
  };

  const handleToggleEmail = async (value: boolean) => {
      const original = emailNotifications;
      setEmailNotifications(value);
      try {
          const response: any = await profileApi.updateProfile({ emailNotifications: value });
          if (!response.success) setEmailNotifications(original);
      } catch (e) {
          setEmailNotifications(original);
      }
  };

  const handleToggleSMS = async (value: boolean) => {
      const original = smsAlerts;
      setSmsAlerts(value);
      try {
          const response: any = await profileApi.updateProfile({ smsNotifications: value });
          if (!response.success) setSmsAlerts(original);
      } catch (e) {
          setSmsAlerts(original);
      }
  };

  const handleDownloadData = async () => {
    Alert.alert(
      'Download My Data',
      'This will export your personal data and recent transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: async () => {
            try {
                // In a real app, this might trigger a download or email
                const response: any = await profileApi.exportData();
                if (response.success) {
                    Alert.alert('Export Ready', 'Your data has been exported successfully. In a real app, this would download a JSON file or send an email.');
                    // console.log("Exported Data:", response.data); 
                } else {
                    Alert.alert('Error', 'Failed to export data');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to export data');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
             try {
                 const response: any = await profileApi.deleteAccount();
                 if (response.success) {
                     // Logout and go to Auth
                     await authApi.logout();
                     Alert.alert('Account Deleted', 'Your account has been successfully deleted/deactivated.');
                     // Navigate to login - access parent navigator or use reset
                     // Assuming navigation structure allow reset or simple navigate to 'Login'
                     navigation.reset({
                         index: 0,
                         routes: [{ name: 'Auth' }], 
                     });
                 } else {
                     Alert.alert('Error', 'Failed to delete account');
                 }
             } catch (error) {
                 Alert.alert('Error', 'Failed to delete account');
             }
          },
        },
      ]
    );
  };

  if (loading) {
      return (
          <View style={[styles.container, styles.centered]}>
              <ActivityIndicator size="large" color={colors.primary} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      {/* Orange Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent && parent.canGoBack()) {
              parent.goBack();
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Privacy & Security</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Change Password Section */}
        <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>CHANGE PASSWORD</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            placeholderTextColor={colors.textLight}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
          />
          <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
            <Ionicons 
              name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={colors.textLight} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor={colors.textLight}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
            <Ionicons 
              name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={colors.textLight} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.passwordHint}>Must be at least 8 characters</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor={colors.textLight}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={colors.textLight} 
            />
          </TouchableOpacity>
        </View>

        {/* Security Settings Section */}
        <Text style={styles.sectionTitle}>SECURITY SETTINGS</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="shield-outline" size={22} color="#2196F3" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingSubtitle}>Add extra layer of security</Text>
            </View>
          </View>
          <Switch
            value={twoFactorAuth}
            onValueChange={handleToggleTwoFactor}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={twoFactorAuth ? colors.textWhite : colors.textLight}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={colors.success} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Login Alerts</Text>
              <Text style={styles.settingSubtitle}>Get notified of new logins</Text>
            </View>
          </View>
          <Switch
            value={loginAlerts}
            onValueChange={handleToggleLoginAlerts}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={loginAlerts ? colors.textWhite : colors.textLight}
          />
        </View>

        {/* Notification Preferences Section */}
        <Text style={styles.sectionTitle}>NOTIFICATION PREFERENCES</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="mail-outline" size={22} color="#9C27B0" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingSubtitle}>Receive updates via email</Text>
            </View>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={handleToggleEmail}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={emailNotifications ? colors.textWhite : colors.textLight}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: '#FFE0B2' }]}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>SMS Alerts</Text>
              <Text style={styles.settingSubtitle}>Receive SMS notifications</Text>
            </View>
          </View>
          <Switch
            value={smsAlerts}
            onValueChange={handleToggleSMS}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={smsAlerts ? colors.textWhite : colors.textLight}
          />
        </View>

        {/* Data & Privacy Section */}
        <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>
        
        <TouchableOpacity style={styles.dataPrivacyItem} onPress={handleDownloadData}>
          <Text style={styles.dataPrivacyText}>Download My Data</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataPrivacyItem} onPress={handleDeleteAccount}>
          <Text style={[styles.dataPrivacyText, styles.deleteAccountText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Update Password Button Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.updatePasswordButton, updatingPassword && styles.updatePasswordButtonDisabled]}
          onPress={handleUpdatePassword}
          disabled={updatingPassword}
        >
          {updatingPassword ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.updatePasswordButtonText}>Update Password</Text>
          )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textLight,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  firstSectionTitle: {
    marginTop: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  passwordHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.md,
  },
  footer: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  updatePasswordButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  updatePasswordButtonDisabled: {
    opacity: 0.6,
  },
  updatePasswordButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  dataPrivacyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataPrivacyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  deleteAccountText: {
    color: colors.error,
  },
});

