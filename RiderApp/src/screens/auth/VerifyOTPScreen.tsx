import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';

type VerifyOTPScreenProps = StackScreenProps<RootStackParamList, 'VerifyOTP'>;

export default function VerifyOTPScreen({ navigation, route }: VerifyOTPScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const email = route.params?.email || '';
  const isLogin = (route.params as any)?.isLogin;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus the last filled input or the 6th input
      const lastIndex = Math.min(index + pastedOtp.length, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the complete 6-digit code.');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please start over.');
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
          // Handle 2FA Login
          const response: any = await authApi.verifyLoginTwoFactor(email, otpCode);
          if (response.success && response.data?.token) {
              const userRole = response.data.user?.role?.toLowerCase();
              if (userRole === "merchant") {
                  navigation.replace("MerchantApp");
              } else if (userRole === "rider") {
                  navigation.replace("RiderApp");
              } else {
                  Alert.alert("Error", `Unknown user role: ${userRole}`);
              }
          } else {
               Alert.alert('Verification Failed', response.error?.message || 'Invalid code.');
               setOtp(['', '', '', '', '', '']);
               // inputRefs check
               if (inputRefs.current[0]) inputRefs.current[0].focus();
          }
      } else {
          // Handle Password Reset OTP
          const response: any = await authApi.verifyOTP(email, otpCode);

          if (response.success) {
            // Navigate to reset password screen with email and code
            navigation.navigate('ResetPassword', { email, code: otpCode });
          } else {
            Alert.alert(
              'Verification Failed',
              response.error?.message || 'Invalid or expired verification code. Please try again.'
            );
            // Clear OTP inputs
            setOtp(['', '', '', '', '', '']);
            // inputRefs check
             if (inputRefs.current[0]) inputRefs.current[0].focus();
          }
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to verify OTP. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0 || !email) {
      return;
    }

    setResending(true);

    try {
      const response: any = await authApi.forgotPassword(email);

      if (response.success) {
        Alert.alert(
          'OTP Resent',
          'A new verification code has been sent to your email. Please check your inbox.'
        );
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert(
          'Error',
          response.error?.message || 'Failed to resend OTP. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to resend OTP. Please check your connection and try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Orange Rounded Header */}
      <View style={styles.orangeHeader}>
        {navigation.canGoBack() && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        )}
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the code sent to</Text>
          <Text style={styles.subtitle}>{email}</Text>
        </View>
      </View>

      {/* White Content Section */}
      <View style={[styles.contentSection, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.label}>Enter 6-digit code</Text>
        
        {/* OTP Input Boxes - Redesigned */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                styles.otpInputEmpty, // Always show empty state first
                digit && styles.otpInputFilled, // Override with filled if has digit
                focusedIndex === index && styles.otpInputFocused // Override with focused if focused
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Timer and Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.timerText}>
            {timer > 0 ? `Resend code in ${timer}s` : ''}
          </Text>
          <TouchableOpacity 
            onPress={handleResendOTP}
            disabled={timer > 0 || resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[
                styles.resendText,
                timer > 0 && styles.resendTextDisabled
              ]}>
                Resend OTP
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.verifyButton,
            (otp.join('').length !== 6 || loading) && styles.verifyButtonDisabled
          ]} 
          onPress={handleVerifyOTP}
          disabled={otp.join('').length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    minHeight: 200,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  headerTextContainer: {
    marginTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  contentSection: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  otpInput: {
    width: 50,
    height: 58,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpInputEmpty: {
    borderColor: '#CCCCCC', // More visible medium grey border - clearly shows all boxes
    backgroundColor: colors.backgroundLight,
    borderWidth: 2.5, // Thicker border for better visibility
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2.5,
  },
  otpInputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
    borderWidth: 3,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  timerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  resendText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  resendTextDisabled: {
    color: colors.textLight,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.textLight,
    opacity: 0.5,
  },
  verifyButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});



