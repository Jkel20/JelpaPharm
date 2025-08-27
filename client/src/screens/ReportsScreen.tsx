import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { CanGenerateReports, PharmacistOrAdmin } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_ENDPOINTS, apiHelpers } from '../config/api';
import api from '../config/api';
import { PDFGenerator } from '../utils/pdfGenerator';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

const ReportsScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('daily');

  const reportTypes = [
    { id: 'daily', label: 'Daily Report', icon: 'calendar-today' },
    { id: 'weekly', label: 'Weekly Report', icon: 'calendar-week' },
    { id: 'monthly', label: 'Monthly Report', icon: 'calendar-month' },
    { id: 'annual', label: 'Annual Report', icon: 'calendar-year' },
    { id: 'inventory', label: 'Inventory Report', icon: 'package-variant' },
    { id: 'sales', label: 'Sales Report', icon: 'trending-up' },
  ];

  const handleGenerateReport = async (reportType: string) => {
    setLoading(true);
    try {
      // Fetch report data from API
      let reportData;
      let reportTitle = '';
      let reportPeriod = '';
      
      switch (reportType) {
        case 'daily':
          reportData = await api.get(API_ENDPOINTS.REPORTS.DAILY_SALES);
          reportTitle = 'Daily Sales Report';
          reportPeriod = `Date: ${moment().format('DD/MM/YYYY')}`;
          break;
        case 'weekly':
          reportData = await api.get(API_ENDPOINTS.REPORTS.WEEKLY_SALES);
          reportTitle = 'Weekly Sales Report';
          reportPeriod = `Week: ${moment().startOf('week').format('DD/MM/YYYY')} - ${moment().endOf('week').format('DD/MM/YYYY')}`;
          break;
        case 'monthly':
          reportData = await api.get(API_ENDPOINTS.REPORTS.MONTHLY_SALES);
          reportTitle = 'Monthly Sales Report';
          reportPeriod = `Month: ${moment().format('MMMM YYYY')}`;
          break;
        case 'annual':
          reportData = await api.get(API_ENDPOINTS.REPORTS.ANNUAL_SALES);
          reportTitle = 'Annual Sales Report';
          reportPeriod = `Year: ${moment().format('YYYY')}`;
          break;
        case 'inventory':
          reportData = await api.get(API_ENDPOINTS.REPORTS.INVENTORY_STATUS);
          reportTitle = 'Inventory Status Report';
          reportPeriod = `Generated: ${moment().format('DD/MM/YYYY')}`;
          break;
        case 'sales':
          reportData = await api.get(API_ENDPOINTS.REPORTS.SALES_ANALYTICS);
          reportTitle = 'Sales Analytics Report';
          reportPeriod = `Period: ${moment().subtract(30, 'days').format('DD/MM/YYYY')} - ${moment().format('DD/MM/YYYY')}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Prepare report data for PDF generation
      const reportPayload = {
        title: reportTitle,
        period: reportPeriod,
        generatedDate: moment().format('DD/MM/YYYY HH:mm'),
        data: reportData.data,
        type: reportType === 'inventory' ? 'inventory' : 'sales' as any,
      };

      // Generate PDF
      const pdfUri = await PDFGenerator.generateReportPDF(reportPayload);
      
      // Share/Download PDF
      const filename = `${reportTitle.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD')}.pdf`;
      await PDFGenerator.sharePDF(pdfUri, filename);
      
      Alert.alert('Success', `${reportTitle} generated and shared successfully!`);
    } catch (error) {
      console.error('Report generation error:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <CanGenerateReports showAccessDenied={true}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pharmacyName}>JELPAPHARM</Text>
            <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
            <Title style={styles.headerTitle}>Reports & Analytics</Title>
            <Text style={styles.headerSubtitle}>
              Generate and view detailed reports
            </Text>
          </View>

          {/* Report Types */}
          <View style={styles.reportsContainer}>
            {reportTypes.map((report) => (
              <Card key={report.id} style={styles.reportCard}>
                <Card.Content>
                  <Title style={styles.reportTitle}>{report.label}</Title>
                  <Text style={styles.reportDescription}>
                    Generate detailed {report.label.toLowerCase()} with analytics
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => handleGenerateReport(report.id)}
                    loading={loading}
                    disabled={loading}
                    style={styles.generateButton}
                  >
                    Generate Report
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>

          {/* Quick Stats */}
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statsTitle}>Quick Statistics</Title>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>GH₵ 15,420</Text>
                  <Text style={styles.statLabel}>Today's Revenue</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>127</Text>
                  <Text style={styles.statLabel}>Today's Sales</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>45</Text>
                  <Text style={styles.statLabel}>Low Stock Items</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Expiring Soon</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          <Footer 
            customText="Comprehensive reporting and analytics"
          />
        </ScrollView>
      </View>
    </CanGenerateReports>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
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
  headerTitle: {
    ...typography.h3,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  reportsContainer: {
    padding: spacing.lg,
  },
  reportCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  reportTitle: {
    ...typography.h5,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  reportDescription: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  generateButton: {
    alignSelf: 'flex-start',
  },
  statsCard: {
    margin: spacing.lg,
    marginTop: 0,
    elevation: 2,
  },
  statsTitle: {
    ...typography.h5,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default ReportsScreen;
