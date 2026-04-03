'use client';

import { useState, useCallback } from 'react';
import type { PayrixConfig } from '@/lib/payrix/types';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CustomerResolutionState {
  status: 'idle' | 'looking' | 'found' | 'not_found' | 'creating';
  customer: Customer | null;
  error: string | null;
}

interface UseCustomerResolutionOptions {
  config: PayrixConfig;
  platformLogin: string;
  platformMerchant: string;
}

interface CreateCustomerInput {
  email: string;
  firstName: string;
  lastName: string;
}

export function useCustomerResolution({
  config,
  platformLogin,
  platformMerchant,
}: UseCustomerResolutionOptions) {
  const [state, setState] = useState<CustomerResolutionState>({
    status: 'idle',
    customer: null,
    error: null,
  });

  const lookupCustomer = useCallback(async (email: string) => {
    setState({ status: 'looking', customer: null, error: null });
    
    try {
      // In real implementation, this would call the platform API
      // For now, simulate the lookup
      const response = await fetch(
        `/api/platform/customers?email=${encodeURIComponent(email)}&merchant=${platformMerchant}`,
        {
          headers: {
            'Authorization': `Bearer ${config.platformApiKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.customers?.length > 0) {
          setState({ status: 'found', customer: data.customers[0], error: null });
        } else {
          setState({ status: 'not_found', customer: null, error: null });
        }
      } else {
        setState({ status: 'not_found', customer: null, error: null });
      }
    } catch (error) {
      setState({ 
        status: 'not_found', 
        customer: null, 
        error: error instanceof Error ? error.message : 'Lookup failed' 
      });
    }
  }, [config.platformApiKey, platformMerchant]);

  const createCustomer = useCallback(async (input: CreateCustomerInput) => {
    setState(prev => ({ ...prev, status: 'creating', error: null }));
    
    try {
      // In real implementation, this would call the platform API
      const response = await fetch('/api/platform/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.platformApiKey}`,
        },
        body: JSON.stringify({
          ...input,
          merchant: platformMerchant,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setState({ status: 'found', customer: data.customer, error: null });
      } else {
        const error = await response.text();
        setState({ status: 'not_found', customer: null, error });
      }
    } catch (error) {
      setState({ 
        status: 'not_found', 
        customer: null, 
        error: error instanceof Error ? error.message : 'Creation failed' 
      });
    }
  }, [config.platformApiKey, platformMerchant]);

  const reset = useCallback(() => {
    setState({ status: 'idle', customer: null, error: null });
  }, []);

  return {
    state,
    resolvedCustomerId: state.customer?.id || null,
    lookupCustomer,
    createCustomer,
    reset,
  };
}
