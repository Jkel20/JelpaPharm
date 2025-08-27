import { API_ENDPOINTS, apiHelpers } from '../../config/api';

describe('API Configuration', () => {
  describe('API_ENDPOINTS', () => {
    it('should have correct auth endpoints', () => {
      expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/api/auth/login');
      expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/api/auth/register');
      expect(API_ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe('/api/auth/forgot-password');
      expect(API_ENDPOINTS.AUTH.RESET_PASSWORD).toBe('/api/auth/reset-password');
    });

    it('should have correct users endpoints', () => {
      expect(API_ENDPOINTS.USERS.LIST).toBe('/api/users');
      expect(API_ENDPOINTS.USERS.CREATE).toBe('/api/users');
      expect(API_ENDPOINTS.USERS.UPDATE('123')).toBe('/api/users/123');
      expect(API_ENDPOINTS.USERS.DELETE('123')).toBe('/api/users/123');
    });

    it('should have correct inventory endpoints', () => {
      expect(API_ENDPOINTS.INVENTORY.LIST).toBe('/api/inventory');
      expect(API_ENDPOINTS.INVENTORY.CREATE).toBe('/api/inventory');
      expect(API_ENDPOINTS.INVENTORY.UPDATE('123')).toBe('/api/inventory/123');
      expect(API_ENDPOINTS.INVENTORY.DELETE('123')).toBe('/api/inventory/123');
    });

    it('should have correct sales endpoints', () => {
      expect(API_ENDPOINTS.SALES.LIST).toBe('/api/sales');
      expect(API_ENDPOINTS.SALES.CREATE).toBe('/api/sales');
      expect(API_ENDPOINTS.SALES.UPDATE('123')).toBe('/api/sales/123');
      expect(API_ENDPOINTS.SALES.DELETE('123')).toBe('/api/sales/123');
    });
  });

  describe('apiHelpers', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(apiHelpers.formatCurrency(1000)).toBe('GH₵ 1,000.00');
        expect(apiHelpers.formatCurrency(1234.56)).toBe('GH₵ 1,234.56');
        expect(apiHelpers.formatCurrency(0)).toBe('GH₵ 0.00');
      });
    });

    describe('formatDate', () => {
      it('should format date correctly', () => {
        const date = new Date('2023-12-25');
        expect(apiHelpers.formatDate(date.toISOString())).toBe('25/12/2023');
      });
    });

    describe('formatDateTime', () => {
      it('should format date time correctly', () => {
        const date = new Date('2023-12-25T10:30:00');
        expect(apiHelpers.formatDateTime(date.toISOString())).toBe('25/12/2023 10:30');
      });
    });
  });
});
