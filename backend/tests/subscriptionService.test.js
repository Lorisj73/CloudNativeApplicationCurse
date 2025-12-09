const subscriptionService = require('../src/services/subscriptionService');

describe('SubscriptionService', () => {
  describe('getSubscriptionPrice', () => {
    test('should return correct price for STANDARD plan', () => {
      const price = subscriptionService.getSubscriptionPrice('STANDARD');
      expect(price).toBe(39.99);
    });

    test('should return correct price for PREMIUM plan', () => {
      const price = subscriptionService.getSubscriptionPrice('PREMIUM');
      expect(price).toBe(59.99);
    });

    test('should return correct price for ETUDIANT plan', () => {
      const price = subscriptionService.getSubscriptionPrice('ETUDIANT');
      expect(price).toBe(29.99);
    });

    test('should return 0 for unknown plan type', () => {
      const price = subscriptionService.getSubscriptionPrice('UNKNOWN');
      expect(price).toBe(0);
    });
  });

  describe('calculateMonthlyBilling', () => {
    test('should calculate base price without discount or penalty', () => {
      const subscription = {
        planType: 'STANDARD',
        startDate: new Date()
      };
      
      const billing = subscriptionService.calculateMonthlyBilling(subscription, 0);
      expect(billing).toBe(39.99);
    });

    test('should apply 10% discount for subscriptions older than 6 months', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 7);
      
      const subscription = {
        planType: 'STANDARD',
        startDate: oldDate
      };
      
      const billing = subscriptionService.calculateMonthlyBilling(subscription, 0);
      expect(billing).toBe(35.99); // 39.99 * 0.9
    });

    test('should apply 15% penalty for more than 5 no-shows', () => {
      const subscription = {
        planType: 'STANDARD',
        startDate: new Date()
      };
      
      const billing = subscriptionService.calculateMonthlyBilling(subscription, 6);
      expect(billing).toBe(45.99); // 39.99 * 1.15
    });

    test('should apply both discount and penalty', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 7);
      
      const subscription = {
        planType: 'PREMIUM',
        startDate: oldDate
      };
      
      const billing = subscriptionService.calculateMonthlyBilling(subscription, 6);
      expect(billing).toBe(62.09); // 59.99 * 0.9 * 1.15
    });
  });
});
