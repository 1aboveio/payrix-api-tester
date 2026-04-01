'use client';

import { useState, useCallback } from 'react';
import { listCustomersAction, createCustomerFromEmailAction } from '@/actions/platform';
import type { Customer } from '@/lib/platform/types';
import type { PayrixConfig } from '@/lib/payrix/types';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { toast } from '@/lib/toast';

export type CustomerResolutionState = 
  | { status: 'idle' }
  | { status: 'looking' }
  | { status: 'found'; customer: Customer; multipleMatches: boolean }
  | { status: 'new' }
  | { status: 'error'; message: string };

interface UseCustomerResolutionOptions {
  config: PayrixConfig;
  platformLogin: string;
  platformMerchant: string;
}

interface UseCustomerResolutionReturn {
  state: CustomerResolutionState;
  resolvedCustomerId: string | null;
  lookupCustomer: (email: string, autoCreate?: boolean) => Promise<void>;
  createCustomer: (email: string, firstName?: string, lastName?: string) => Promise<string | null>;
  reset: () => void;
}

export function useCustomerResolution({
  config,
  platformLogin,
  platformMerchant,
}: UseCustomerResolutionOptions): UseCustomerResolutionReturn {
  const [state, setState] = useState<CustomerResolutionState>({ status: 'idle' });
  const [resolvedCustomerId, setResolvedCustomerId] = useState<string | null>(null);

  // Create customer function — declared BEFORE lookupCustomer to avoid hoisting issues
  const createCustomer = useCallback(async (email: string, firstName?: string, lastName?: string): Promise<string | null> => {
    try {
      const requestId = generateRequestId();
      const result = await createCustomerFromEmailAction(
        { config, requestId },
        {
          login: platformLogin,
          merchant: platformMerchant,
          email: email.trim(),
          firstName: firstName?.trim() || undefined,
          lastName: lastName?.trim() || undefined,
        }
      );

      if (result.apiResponse.error) {
        toast.error(`Failed to create customer: ${result.apiResponse.error}`);
        return null;
      }

      const newCustomer = result.apiResponse.data as Customer[] | Customer | undefined;
      const customerObj = Array.isArray(newCustomer) ? newCustomer[0] : newCustomer;
      
      if (customerObj?.id) {
        setResolvedCustomerId(customerObj.id);
        setState({ status: 'found', customer: customerObj, multipleMatches: false });
        return customerObj.id;
      } else {
        toast.error('Customer creation returned no ID');
        return null;
      }
    } catch (error) {
      toast.error('Failed to create customer');
      console.error(error);
      return null;
    }
  }, [config, platformLogin, platformMerchant]);

  // Lookup customer — can now reference createCustomer
  const lookupCustomer = useCallback(async (email: string, autoCreate: boolean = true) => {
    if (!email.includes('@')) {
      setState({ status: 'error', message: 'Invalid email address' });
      return;
    }

    setState({ status: 'looking' });
    setResolvedCustomerId(null);

    try {
      const requestId = generateRequestId();
      const result = await listCustomersAction(
        { config, requestId },
        [{ field: 'email', operator: 'eq', value: email.trim() }],
        { limit: 10 }
      );

      if (result.apiResponse.error) {
        // Treat lookup error as "new" to allow flow to continue
        setState({ status: 'new' });
        toast.info('Customer lookup failed — will create new customer');
        return;
      }

      const customers = result.apiResponse.data as Customer[] | undefined;

      if (!customers || customers.length === 0) {
        // No existing customer found
        if (autoCreate) {
          // Auto-create customer for new emails
          toast.info('Creating new customer...');
          const newId = await createCustomer(email);
          if (!newId) {
            setState({ status: 'error', message: 'Failed to create customer' });
          }
          // createCustomer will set state to 'found' and resolvedCustomerId
        } else {
          setState({ status: 'new' });
        }
      } else if (customers.length === 1) {
        setState({ status: 'found', customer: customers[0], multipleMatches: false });
        setResolvedCustomerId(customers[0].id);
      } else {
        // Multiple matches — use first, show warning
        setState({ status: 'found', customer: customers[0], multipleMatches: true });
        setResolvedCustomerId(customers[0].id);
      }
    } catch (error) {
      setState({ status: 'error', message: 'Lookup failed' });
      console.error(error);
    }
  }, [config, createCustomer]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
    setResolvedCustomerId(null);
  }, []);

  return {
    state,
    resolvedCustomerId,
    lookupCustomer,
    createCustomer,
    reset,
  };
}
