import { Platform } from 'react-native';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { HTMLTemplates, ReceiptData, ReportData } from './htmlTemplates';

export class PDFGenerator {
  static async generateReceiptPDF(receiptData: ReceiptData): Promise<string> {
    if (Platform.OS === 'web') {
      return this.generateReceiptPDFWeb(receiptData);
    } else {
      return this.generateReceiptPDFMobile(receiptData);
    }
  }

  static async generateReportPDF(reportData: ReportData): Promise<string> {
    if (Platform.OS === 'web') {
      return this.generateReportPDFWeb(reportData);
    } else {
      return this.generateReportPDFMobile(reportData);
    }
  }

  private static async generateReceiptPDFWeb(receiptData: ReceiptData): Promise<string> {
    const htmlContent = HTMLTemplates.generateReceiptHTML(receiptData);
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      document.body.removeChild(element);
      return pdfUrl;
    } catch (error) {
      document.body.removeChild(element);
      throw new Error('Failed to generate PDF: ' + error);
    }
  }

  private static async generateReceiptPDFMobile(receiptData: ReceiptData): Promise<string> {
    const htmlContent = HTMLTemplates.generateReceiptHTML(receiptData);
    
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      return uri;
    } catch (error) {
      throw new Error('Failed to generate PDF: ' + error);
    }
  }

  private static async generateReportPDFWeb(reportData: ReportData): Promise<string> {
    const htmlContent = HTMLTemplates.generateReportHTML(reportData);
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      document.body.removeChild(element);
      return pdfUrl;
    } catch (error) {
      document.body.removeChild(element);
      throw new Error('Failed to generate PDF: ' + error);
    }
  }

  private static async generateReportPDFMobile(reportData: ReportData): Promise<string> {
    const htmlContent = HTMLTemplates.generateReportHTML(reportData);
    
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      return uri;
    } catch (error) {
      throw new Error('Failed to generate PDF: ' + error);
    }
  }







  static async sharePDF(pdfUri: string, filename: string): Promise<void> {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = pdfUri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: filename
        });
      }
    }
  }
}
