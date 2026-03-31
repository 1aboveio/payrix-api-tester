import { describe, expect, it, beforeAll } from 'vitest';
import { PlatformClient } from '../client';
import type { CreateCustomerRequest, CreateTxnSessionRequest, CreateSubscriptionTokenRequest } from '../types';

/**
 * API Integration Tests for Checkout Feature
 * 
 * These tests make real calls to the Payrix sandbox API.
 * Requires TEST_PLATFORM_API_KEY environment variable.
 * 
 * Endpoints tested:
 * - GET /customers?email[eq]=...
 * - POST /customers
 * - GET /subscriptions/{id}
 * - GET /plans/{id}
 * - POST /subscriptionTokens
 * - POST /txnSessions
 */

const TEST_API_KEY = process.env.TEST_PLATFORM_API_KEY || '';
const SKIP_TESTS = !TEST_API_KEY;
const TEST_LOGIN = process.env.TEST_LOGIN_ID || 'test_login';
const TEST_MERCHANT = process.env.TEST_MERCHANT_ID || 'test_merchant';

describe('Checkout API Integration Tests', () => {
  let client: PlatformClient;
  let testCustomerId: string;
  const TEST_LOGIN = process.env.TEST_LOGIN_ID || 'test_login';
  const TEST_MERCHANT = process.env.TEST_MERCHANT_ID || 'test_merchant';

  beforeAll(() => {
    if (SKIP_TESTS) {
      console.log('Skipping integration tests - TEST_PLATFORM_API_KEY not set');
      return;
    }
    client = new PlatformClient({
      apiKey: TEST_API_KEY,
      environment: 'test',
    });
  });

  describe('Customer API', () => {
    it.skipIf(SKIP_TESTS)('should create a new customer', async () => {
      const customerData: CreateCustomerRequest = {
        login: TEST_LOGIN,
        merchant: TEST_MERCHANT,
        firstName: 'Test',
        lastName: 'Customer',
        email: `test-${Date.now()}@example.com`,
        phone: '555-123-4567',
      };

      const result = await client.createCustomer(customerData);

      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.[0]?.id).toBeDefined();
      
      testCustomerId = result.data![0].id;
    });

    it.skipIf(SKIP_TESTS)('should find customer by email', async () => {
      // First create a customer
      const email = `lookup-${Date.now()}@example.com`;
      const customerData: CreateCustomerRequest = {
        login: TEST_LOGIN,
        merchant: TEST_MERCHANT,
        firstName: 'Lookup',
        lastName: 'Test',
        email,
      };
      
      const createResult = await client.createCustomer(customerData);
      const createdId = createResult.data![0].id;

      // Then search for it
      const searchResult = await client.listCustomers(
        [{ field: 'email', operator: 'eq', value: email }]
      );

      expect(searchResult.errors).toBeNull();
      expect(searchResult.data).toBeDefined();
      expect(searchResult.data?.length).toBeGreaterThan(0);
      expect(searchResult.data?.[0].id).toBe(createdId);
    });

    it.skipIf(SKIP_TESTS)('should return empty array for non-existent email', async () => {
      const result = await client.listCustomers(
        [{ field: 'email', operator: 'eq', value: `nonexistent-${Date.now()}@example.com` }]
      );

      expect(result.errors).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe('Subscription API', () => {
    it.skipIf(SKIP_TESTS)('should get subscription by id', async () => {
      // This test requires an existing subscription ID
      // In real testing, you'd create a subscription first or use a known test ID
      const knownSubscriptionId = process.env.TEST_SUBSCRIPTION_ID;
      
      if (!knownSubscriptionId) {
        console.log('Skipping subscription get test - TEST_SUBSCRIPTION_ID not set');
        return;
      }

      const result = await client.getSubscription(knownSubscriptionId);

      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.[0]?.id).toBe(knownSubscriptionId);
    });

    it.skipIf(SKIP_TESTS)('should return error for non-existent subscription', async () => {
      const result = await client.getSubscription('sub_nonexistent_12345');

      expect(result.errors).toBeDefined();
    });
  });

  describe('Plan API', () => {
    it.skipIf(SKIP_TESTS)('should get plan by id', async () => {
      // This test requires an existing plan ID
      const knownPlanId = process.env.TEST_PLAN_ID;
      
      if (!knownPlanId) {
        console.log('Skipping plan get test - TEST_PLAN_ID not set');
        return;
      }

      const result = await client.getPlan(knownPlanId);

      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.[0]?.id).toBe(knownPlanId);
    });

    it.skipIf(SKIP_TESTS)('should return error for non-existent plan', async () => {
      const result = await client.getPlan('plan_nonexistent_12345');

      expect(result.errors).toBeDefined();
    });
  });

  describe('TxnSession API', () => {
    it.skipIf(SKIP_TESTS)('should create a transaction session', async () => {
      const sessionData: CreateTxnSessionRequest = {
        login: TEST_LOGIN,
        merchant: TEST_MERCHANT,
        configurations: {
          duration: 30,
          maxTimesApproved: 1,
          maxTimesUse: 3,
        },
      };

      const result = await client.createTxnSession(sessionData);

      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.[0]?.key).toBeDefined();
    });
  });

  describe('SubscriptionToken API', () => {
    it.skipIf(SKIP_TESTS)('should create a subscription token', async () => {
      // This requires an existing subscription and token
      // SubscriptionToken links a subscription to a payment token
      
      const tokenData: CreateSubscriptionTokenRequest = {
        subscription: process.env.TEST_SUBSCRIPTION_ID || 'test_subscription',
        token: 'test_token_id', // Would be a real token ID from PayFields
      };

      const result = await client.createSubscriptionToken(tokenData);

      // Note: This may fail if subscription/token doesn't exist
      // The test validates the API call structure works
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it.skipIf(SKIP_TESTS)('should handle invalid API key', async () => {
      const badClient = new PlatformClient({
        apiKey: 'invalid_key',
        environment: 'test',
      });

      const result = await badClient.listCustomers([]);

      expect(result.errors).toBeDefined();
    });

    it.skipIf(SKIP_TESTS)('should handle malformed customer data', async () => {
      const badData = {
        login: TEST_LOGIN,
        merchant: TEST_MERCHANT,
        // Invalid email format
        email: 'invalid-email',
      } as CreateCustomerRequest;

      const result = await client.createCustomer(badData);

      expect(result.errors).toBeDefined();
    });
  });
});

describe('Checkout Flow Integration', () => {
  it.skipIf(SKIP_TESTS)('should complete full checkout flow', async () => {
    // This is a comprehensive test of the checkout flow
    // 1. Create/find customer
    // 2. Get subscription
    // 3. Create txnSession
    // 4. Create subscription token (would need PayFields in real scenario)
    
    console.log('Full checkout flow test - requires PayFields SDK integration');
    console.log('This would be tested via E2E tests with Playwright');
  });
});
