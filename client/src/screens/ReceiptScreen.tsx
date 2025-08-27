import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  Divider,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import moment from 'moment';
import Footer from '../components/Layout/Footer';
import { PDFGenerator } from '../utils/pdfGenerator';

const { width } = Dimensions.get('window');

interface ReceiptItem {
  drug: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionRequired: boolean;
  prescriptionNumber?: string;
}

interface ReceiptData {
  _id: string;
  receiptNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  cashier: {
    firstName: string;
    lastName: string;
  };
  pharmacist?: {
    firstName: string;
    lastName: string;
  };
  prescriptionNumber?: string;
  notes?: string;
  createdAt: string;
}

const ReceiptScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const receiptId = route.params?.receiptId;

  useEffect(() => {
    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  const fetchReceipt = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sales/${receiptId}`);
      setReceipt(response.data.data);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      Alert.alert('Error', 'Failed to load receipt details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (!receipt) return;
      
      // Convert receipt data to PDF format
      const receiptData = {
        receiptNumber: receipt.receiptNumber,
        date: moment(receipt.createdAt).format('DD/MM/YYYY HH:mm'),
        customerName: receipt.customerName,
        items: receipt.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.totalPrice,
        })),
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        total: receipt.totalAmount,
        paymentMethod: getPaymentMethodDisplay(receipt.paymentMethod),
        cashier: `${receipt.cashier.firstName} ${receipt.cashier.lastName}`,
        notes: receipt.notes,
      };

      // Generate PDF
      const pdfUri = await PDFGenerator.generateReceiptPDF(receiptData);
      
      // Share/Download PDF
      await PDFGenerator.sharePDF(pdfUri, `Receipt_${receipt.receiptNumber}.pdf`);
      
      setSnackbarMessage('Receipt PDF generated and shared successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'Failed to generate PDF receipt');
    }
  };

  const handleShare = async () => {
    try {
      const receiptContent = generateReceiptContent();
      
      await Share.share({
        message: receiptContent,
        title: `Receipt ${receipt?.receiptNumber}`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Error', 'Failed to share receipt');
    }
  };

  const generateReceiptContent = (): string => {
    if (!receipt) return '';

          let content = `JELPAPHARM PHARMACY MANAGEMENT SYSTEM\n`;
    content += `=====================================\n\n`;
    content += `Receipt No: ${receipt.receiptNumber}\n`;
    content += `Date: ${moment(receipt.createdAt).format('DD/MM/YYYY HH:mm')}\n`;
    content += `Cashier: ${receipt.cashier.firstName} ${receipt.cashier.lastName}\n`;
    if (receipt.pharmacist) {
      content += `Pharmacist: ${receipt.pharmacist.firstName} ${receipt.pharmacist.lastName}\n`;
    }
    content += `Customer: ${receipt.customerName}\n`;
    if (receipt.customerPhone) {
      content += `Phone: ${receipt.customerPhone}\n`;
    }
    content += `\n=====================================\n`;
    content += `ITEMS:\n`;
    content += `=====================================\n`;

    receipt.items.forEach((item, index) => {
      content += `${index + 1}. ${item.name}\n`;
      content += `   ${item.quantity} x GH₵ ${item.unitPrice.toFixed(2)} = GH₵ ${item.totalPrice.toFixed(2)}\n`;
      if (item.prescriptionRequired && item.prescriptionNumber) {
        content += `   Prescription: ${item.prescriptionNumber}\n`;
      }
      content += `\n`;
    });

    content += `=====================================\n`;
    content += `Subtotal: GH₵ ${receipt.subtotal.toFixed(2)}\n`;
    content += `Tax (12.5%): GH₵ ${receipt.tax.toFixed(2)}\n`;
    if (receipt.discount > 0) {
      content += `Discount: -GH₵ ${receipt.discount.toFixed(2)}\n`;
    }
    content += `=====================================\n`;
    content += `TOTAL: GH₵ ${receipt.totalAmount.toFixed(2)}\n`;
    content += `=====================================\n`;
    content += `Payment Method: ${receipt.paymentMethod}\n`;
    content += `Status: ${receipt.paymentStatus}\n`;
    content += `\nThank you for your purchase!\n`;
    content += `Please keep this receipt for your records.\n`;

    return content;
  };

  const formatCurrency = (amount: number): string => {
    return `GH₵ ${amount.toFixed(2)}`;
  };

  const getPaymentMethodDisplay = (method: string): string => {
    const methods: { [key: string]: string } = {
      cash: 'Cash',
      mobile_money: 'Mobile Money',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading receipt...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.errorContainer}>
        <Text>Receipt not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.receiptCard}>
          <Card.Content>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.pharmacyName}>JELPAPHARM</Text>
              <Text style={styles.pharmacySubtitle}>Management System</Text>
              <Text style={styles.receiptNumber}>Receipt #{receipt.receiptNumber}</Text>
              <Text style={styles.date}>
                {moment(receipt.createdAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <Text style={styles.customerName}>{receipt.customerName}</Text>
              {receipt.customerPhone && (
                <Text style={styles.customerPhone}>{receipt.customerPhone}</Text>
              )}
              {receipt.customerEmail && (
                <Text style={styles.customerEmail}>{receipt.customerEmail}</Text>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items Purchased</Text>
              {receipt.items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.prescriptionRequired && (
                      <Text style={styles.prescriptionBadge}>Rx Required</Text>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.totalPrice)}
                    </Text>
                  </View>
                  {item.prescriptionRequired && item.prescriptionNumber && (
                    <Text style={styles.prescriptionNumber}>
                      Prescription: {item.prescriptionNumber}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <Divider style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(receipt.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (12.5%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(receipt.tax)}</Text>
              </View>
              {receipt.discount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount:</Text>
                  <Text style={styles.discountValue}>-{formatCurrency(receipt.discount)}</Text>
                </View>
              )}
              <Divider style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>TOTAL:</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(receipt.totalAmount)}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Payment Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <Text style={styles.paymentMethod}>
                Method: {getPaymentMethodDisplay(receipt.paymentMethod)}
              </Text>
              <Text style={styles.paymentStatus}>
                Status: {receipt.paymentStatus.toUpperCase()}
              </Text>
              <Text style={styles.cashierInfo}>
                Cashier: {receipt.cashier.firstName} {receipt.cashier.lastName}
              </Text>
              {receipt.pharmacist && (
                <Text style={styles.pharmacistInfo}>
                  Pharmacist: {receipt.pharmacist.firstName} {receipt.pharmacist.lastName}
                </Text>
              )}
            </View>

            {receipt.notes && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notes}>{receipt.notes}</Text>
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Thank you for your purchase!</Text>
              <Text style={styles.footerText}>Please keep this receipt for your records.</Text>
              <Text style={styles.footerText}>For questions, contact: +233 XX XXX XXXX</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Footer 
          customText="Digital receipt with professional formatting"
        />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handlePrint}
          style={styles.actionButton}
          icon="printer"
        >
          Print Receipt
        </Button>
        <Button
          mode="outlined"
          onPress={handleShare}
          style={styles.actionButton}
          icon="share"
        >
          Share Receipt
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
          icon="arrow-left"
        >
          Back
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  receiptCard: {
    margin: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pharmacyName: {
    ...typography.h3,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  pharmacySubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  receiptNumber: {
    ...typography.h5,
    color: theme.colors.primary,
    marginTop: spacing.sm,
  },
  date: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h6,
    color: theme.colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  customerName: {
    ...typography.body1,
    fontWeight: '600',
  },
  customerPhone: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.8,
  },
  customerEmail: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.8,
  },
  itemContainer: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.body1,
    fontWeight: '500',
    flex: 1,
  },
  prescriptionBadge: {
    ...typography.caption,
    backgroundColor: theme.colors.warning,
    color: 'white',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  itemTotal: {
    ...typography.body1,
    fontWeight: '600',
  },
  prescriptionNumber: {
    ...typography.caption,
    color: theme.colors.warning,
    marginTop: spacing.xs,
  },
  totalsSection: {
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    ...typography.body1,
  },
  totalValue: {
    ...typography.body1,
    fontWeight: '500',
  },
  discountValue: {
    ...typography.body1,
    fontWeight: '500',
    color: theme.colors.success,
  },
  grandTotalLabel: {
    ...typography.h5,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    ...typography.h5,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  paymentMethod: {
    ...typography.body1,
    marginBottom: spacing.xs,
  },
  paymentStatus: {
    ...typography.body1,
    marginBottom: spacing.xs,
  },
  cashierInfo: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.8,
  },
  pharmacistInfo: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.8,
  },
  notes: {
    ...typography.body2,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body2,
    textAlign: 'center',
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.disabled,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  snackbar: {
    backgroundColor: theme.colors.success,
  },
});

export default ReceiptScreen;
