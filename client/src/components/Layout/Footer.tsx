import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { theme, spacing, typography } from '../../theme';
import moment from 'moment';

const { width } = Dimensions.get('window');

interface FooterProps {
  showDivider?: boolean;
  showVersion?: boolean;
  showCopyright?: boolean;
  customText?: string;
}

const Footer: React.FC<FooterProps> = ({
  showDivider = true,
  showVersion = true,
  showCopyright = true,
  customText,
}) => {
  return (
    <View style={styles.container}>
      {showDivider && <Divider style={styles.divider} />}
      
      <View style={styles.content}>
        <View style={styles.mainSection}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          
          {customText && (
            <Text style={styles.customText}>{customText}</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          {showVersion && (
            <Text style={styles.versionText}>Version 1.0.0</Text>
          )}
          
          {showCopyright && (
            <Text style={styles.copyrightText}>
              © {moment().year()} JELPAPHARM. All rights reserved.
            </Text>
          )}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactText}>Contact: +233 XX XXX XXXX</Text>
          <Text style={styles.contactText}>Email: info@jelpapharm.com</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: 'auto', // Push to bottom
  },
  divider: {
    marginBottom: spacing.md,
  },
  content: {
    alignItems: 'center',
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pharmacyName: {
    ...typography.h5,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pharmacySubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  customText: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  versionText: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  copyrightText: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.6,
    textAlign: 'center',
  },
  contactSection: {
    alignItems: 'center',
  },
  contactText: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});

export default Footer;
