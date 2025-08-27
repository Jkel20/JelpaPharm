import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Paragraph,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import Footer from '../components/Layout/Footer';

const resetSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface ResetFormData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

const PasswordResetScreen: React.FC = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigation = useNavigation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetFormData>({
    resolver: yupResolver(resetSchema),
    defaultValues: {
      email: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      // First, verify the email exists
      const verifyResponse = await axios.post(`${API_BASE_URL}/api/auth/verify-email`, {
        email: data.email,
      });

      if (verifyResponse.data.success) {
        // Email exists, proceed with password reset
        const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
          email: data.email,
          newPassword: data.newPassword,
        });

        if (resetResponse.data.success) {
          setSnackbarMessage('Password reset successful! Please check your email for further instructions.');
          setSnackbarVisible(true);
          reset();
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.response?.status === 404) {
        Alert.alert(
          'Email Not Found',
          'The email address you entered is not registered in our system. Please check the email address and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 400) {
        Alert.alert(
          'Invalid Request',
          error.response.data.error?.message || 'Please check your input and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.code === 'NETWORK_ERROR') {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Reset Error',
          'An unexpected error occurred. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          <Title style={styles.title}>Reset Password</Title>
          <Paragraph style={styles.subtitle}>
            Enter your email and new password to reset your account
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  error={!!errors.email}
                  left={<TextInput.Icon icon="email" />}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email?.message}
            </HelperText>

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="New Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  secureTextEntry={!showNewPassword}
                  style={styles.input}
                  error={!!errors.newPassword}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showNewPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    />
                  }
                />
              )}
            />
            <HelperText type="error" visible={!!errors.newPassword}>
              {errors.newPassword?.message}
            </HelperText>

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirm New Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  error={!!errors.confirmPassword}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
              )}
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword?.message}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.resetButton}
              contentStyle={styles.resetButtonContent}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <Button
              mode="text"
              onPress={handleBackToLogin}
              style={styles.backButton}
            >
              Back to Login
            </Button>
          </Card.Content>
        </Card>

        <Footer 
          showDivider={false}
          customText="Need help? Contact your system administrator"
        />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pharmacyName: {
    ...typography.h4,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  pharmacySubtitle: {
    ...typography.body1,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    marginBottom: spacing.sm,
  },
  resetButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  resetButtonContent: {
    paddingVertical: spacing.sm,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  snackbar: {
    backgroundColor: theme.colors.success,
  },
});

export default PasswordResetScreen;
