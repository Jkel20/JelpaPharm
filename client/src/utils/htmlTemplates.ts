export interface ReceiptData {
  receiptNumber: string;
  date: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashier: string;
  notes?: string;
}

export interface ReportData {
  title: string;
  period: string;
  generatedDate: string;
  data: any;
  type: 'sales' | 'inventory' | 'users' | 'alerts';
}

export class HTMLTemplates {
  static generateReceiptHTML(receiptData: ReceiptData): string {
    const formatCurrency = (amount: number) => `GH₵ ${amount.toFixed(2)}`;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${receiptData.receiptNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              border: 2px solid #1E4D2B;
              border-radius: 8px;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1E4D2B;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .pharmacy-name {
              font-size: 24px;
              font-weight: bold;
              color: #1E4D2B;
              margin-bottom: 5px;
            }
            .receipt-number {
              font-size: 16px;
              color: #666;
              margin-bottom: 5px;
            }
            .date {
              font-size: 14px;
              color: #666;
            }
            .customer-info {
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th,
            .items-table td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .items-table th {
              background-color: #1E4D2B;
              color: white;
              font-weight: bold;
            }
            .totals {
              border-top: 2px solid #1E4D2B;
              padding-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 18px;
              color: #1E4D2B;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .payment-info {
              margin-top: 20px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="pharmacy-name">JELPAPHARM Pharmacy Management</div>
              <div class="receipt-number">Receipt #${receiptData.receiptNumber}</div>
              <div class="date">${receiptData.date}</div>
            </div>
            
            <div class="customer-info">
              <strong>Customer:</strong> ${receiptData.customerName}
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(receiptData.subtotal)}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>${formatCurrency(receiptData.tax)}</span>
              </div>
              <div class="total-row final">
                <span>Total:</span>
                <span>${formatCurrency(receiptData.total)}</span>
              </div>
            </div>
            
            <div class="payment-info">
              <div><strong>Payment Method:</strong> ${receiptData.paymentMethod}</div>
              <div><strong>Cashier:</strong> ${receiptData.cashier}</div>
              ${receiptData.notes ? `<div><strong>Notes:</strong> ${receiptData.notes}</div>` : ''}
            </div>
            
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>JELPAPHARM Pharmacy Management System</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static generateReportHTML(reportData: ReportData): string {
    const formatCurrency = (amount: number) => `GH₵ ${amount.toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString();
    
    let reportContent = '';
    
    switch (reportData.type) {
      case 'sales':
        reportContent = this.generateSalesReportContent(reportData.data, formatCurrency, formatDate);
        break;
      case 'inventory':
        reportContent = this.generateInventoryReportContent(reportData.data, formatCurrency);
        break;
      case 'users':
        reportContent = this.generateUsersReportContent(reportData.data);
        break;
      case 'alerts':
        reportContent = this.generateAlertsReportContent(reportData.data, formatDate);
        break;
    }
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${reportData.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
            }
            .report {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #1E4D2B;
              border-radius: 8px;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1E4D2B;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .report-title {
              font-size: 28px;
              font-weight: bold;
              color: #1E4D2B;
              margin-bottom: 10px;
            }
            .report-meta {
              font-size: 14px;
              color: #666;
            }
            .content {
              margin-bottom: 20px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .data-table th,
            .data-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .data-table th {
              background-color: #1E4D2B;
              color: white;
              font-weight: bold;
            }
            .data-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .summary {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div class="report-title">${reportData.title}</div>
              <div class="report-meta">
                <div>Period: ${reportData.period}</div>
                <div>Generated: ${reportData.generatedDate}</div>
              </div>
            </div>
            
            <div class="content">
              ${reportContent}
            </div>
            
            <div class="footer">
              <p>JELPAPHARM Pharmacy Management System</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static generateSalesReportContent(data: any, formatCurrency: (amount: number) => string, formatDate: (date: string) => string): string {
    return `
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-item">
          <span>Total Sales:</span>
          <span>${formatCurrency(data.totalSales || 0)}</span>
        </div>
        <div class="summary-item">
          <span>Total Transactions:</span>
          <span>${data.totalTransactions || 0}</span>
        </div>
        <div class="summary-item">
          <span>Average Transaction:</span>
          <span>${formatCurrency(data.averageTransaction || 0)}</span>
        </div>
      </div>
      
      <h3>Sales Details</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Receipt #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment Method</th>
          </tr>
        </thead>
        <tbody>
          ${(data.sales || []).map((sale: any) => `
            <tr>
              <td>${formatDate(sale.date)}</td>
              <td>${sale.receiptNumber}</td>
              <td>${sale.customerName}</td>
              <td>${sale.itemCount}</td>
              <td>${formatCurrency(sale.total)}</td>
              <td>${sale.paymentMethod}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private static generateInventoryReportContent(data: any, formatCurrency: (amount: number) => string): string {
    return `
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-item">
          <span>Total Items:</span>
          <span>${data.totalItems || 0}</span>
        </div>
        <div class="summary-item">
          <span>Low Stock Items:</span>
          <span>${data.lowStockItems || 0}</span>
        </div>
        <div class="summary-item">
          <span>Expiring Items:</span>
          <span>${data.expiringItems || 0}</span>
        </div>
      </div>
      
      <h3>Inventory Details</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Stock Level</th>
            <th>Unit Price</th>
            <th>Total Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(data.items || []).map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>${item.stockLevel}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.totalValue)}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private static generateUsersReportContent(data: any): string {
    return `
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-item">
          <span>Total Users:</span>
          <span>${data.totalUsers || 0}</span>
        </div>
        <div class="summary-item">
          <span>Active Users:</span>
          <span>${data.activeUsers || 0}</span>
        </div>
        <div class="summary-item">
          <span>Inactive Users:</span>
          <span>${data.inactiveUsers || 0}</span>
        </div>
      </div>
      
      <h3>User Details</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created Date</th>
          </tr>
        </thead>
        <tbody>
          ${(data.users || []).map((user: any) => `
            <tr>
              <td>${user.fullName}</td>
              <td>${user.email}</td>
              <td>${user.phone}</td>
              <td>${user.role}</td>
              <td>${user.isActive ? 'Active' : 'Inactive'}</td>
              <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private static generateAlertsReportContent(data: any, formatDate: (date: string) => string): string {
    return `
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-item">
          <span>Total Alerts:</span>
          <span>${data.totalAlerts || 0}</span>
        </div>
        <div class="summary-item">
          <span>Low Stock Alerts:</span>
          <span>${data.lowStockAlerts || 0}</span>
        </div>
        <div class="summary-item">
          <span>Expiry Alerts:</span>
          <span>${data.expiryAlerts || 0}</span>
        </div>
      </div>
      
      <h3>Alert Details</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Item Name</th>
            <th>Message</th>
            <th>Created Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(data.alerts || []).map((alert: any) => `
            <tr>
              <td>${alert.type}</td>
              <td>${alert.itemName}</td>
              <td>${alert.message}</td>
              <td>${formatDate(alert.createdAt)}</td>
              <td>${alert.isRead ? 'Read' : 'Unread'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}
