import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `${process.env.APP_NAME} <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(message);

    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;

  const message = `
    You are receiving this email because you (or someone else) has requested the reset of a password.
    
    Please click on the following link to reset your password:
    ${resetUrl}
    
    If you did not request this, please ignore this email and your password will remain unchanged.
    
    This link will expire in 10 minutes.
    
    Best regards,
    JELPAPHARM Pharmacy Management System Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h2 style="color: #28a745; margin: 0;">JELPAPHARM Pharmacy Management System</h2>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h3 style="color: #333;">Password Reset Request</h3>
        
        <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
        
        <p>Please click on the following button to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        
        <p><strong>Important:</strong> This link will expire in 10 minutes.</p>
        
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>JELPAPHARM Pharmacy Management System Team</strong>
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset Request - JELPAPHARM Pharmacy Management System',
    message,
    html: htmlMessage
  });
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  const message = `
    Welcome to the JELPAPHARM Pharmacy Management System!
    
    Dear ${firstName},
    
    Thank you for registering with our pharmacy management system. Your account has been successfully created.
    
    You can now log in to your account and start managing your pharmacy operations efficiently.
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    JELPAPHARM Pharmacy Management System Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #28a745; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Welcome to JELPAPHARM Pharmacy Management System</h2>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h3 style="color: #333;">Welcome, ${firstName}!</h3>
        
        <p>Thank you for registering with our pharmacy management system. Your account has been successfully created.</p>
        
        <p>You can now log in to your account and start managing your pharmacy operations efficiently.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="margin: 0;"><strong>What you can do:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Manage inventory and stock levels</li>
            <li>Process sales and generate receipts</li>
            <li>Track expiring medications</li>
            <li>Generate comprehensive reports</li>
            <li>Manage user accounts and permissions</li>
          </ul>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>JELPAPHARM Pharmacy Management System Team</strong>
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Welcome to JELPAPHARM Pharmacy Management System',
    message,
    html: htmlMessage
  });
};

// Send low stock alert
export const sendLowStockAlert = async (email: string, items: any[]): Promise<void> => {
  const message = `
    Low Stock Alert
    
    The following items are running low on stock and need to be reordered:
    
    ${items.map(item => `- ${item.name} (${item.brandName}): ${item.quantity} remaining`).join('\n')}
    
    Please take action to restock these items to avoid stockouts.
    
    Best regards,
    JELPAPHARM Pharmacy Management System Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc3545; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Low Stock Alert</h2>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h3 style="color: #333;">Attention: Low Stock Items</h3>
        
        <p>The following items are running low on stock and need to be reordered:</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          ${items.map(item => `
            <div style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 3px;">
              <strong>${item.name}</strong> (${item.brandName})<br>
              <span style="color: #dc3545;">Quantity remaining: ${item.quantity}</span>
            </div>
          `).join('')}
        </div>
        
        <p>Please take action to restock these items to avoid stockouts.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>JELPAPHARM Pharmacy Management System Team</strong>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Low Stock Alert - JELPAPHARM Pharmacy Management System',
    message,
    html: htmlMessage
  });
};

// Send expiry alert
export const sendExpiryAlert = async (email: string, items: any[]): Promise<void> => {
  const message = `
    Expiry Alert
    
    The following items are expiring soon:
    
    ${items.map(item => `- ${item.name} (${item.brandName}): Expires on ${new Date(item.expiryDate).toLocaleDateString()}`).join('\n')}
    
    Please take action to manage these items before they expire.
    
    Best regards,
    JELPAPHARM Pharmacy Management System Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #ffc107; padding: 20px; text-align: center;">
        <h2 style="color: #333; margin: 0;">Expiry Alert</h2>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h3 style="color: #333;">Attention: Items Expiring Soon</h3>
        
        <p>The following items are expiring soon:</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          ${items.map(item => `
            <div style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 3px;">
              <strong>${item.name}</strong> (${item.brandName})<br>
              <span style="color: #dc3545;">Expires: ${new Date(item.expiryDate).toLocaleDateString()}</span>
            </div>
          `).join('')}
        </div>
        
        <p>Please take action to manage these items before they expire.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>JELPAPHARM Pharmacy Management System Team</strong>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Expiry Alert - JELPAPHARM Pharmacy Management System',
    message,
    html: htmlMessage
  });
};
