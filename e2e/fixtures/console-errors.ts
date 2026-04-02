import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture that captures console errors
 * 
 * Usage: import { test } from './fixtures/console-errors'
 * Instead of: import { test } from '@playwright/test'
 */

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Capture unhandled page errors
    page.on('pageerror', err => {
      errors.push(err.message);
    });
    
    await use(page);
    
    // Filter known noise, fail on unexpected errors
    const unexpected = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('hydration') &&
      !e.includes('source map')
    );
    
    // Fail test if unexpected console errors found
    expect(
      unexpected, 
      `Unexpected console errors:\n${unexpected.join('\n')}`
    ).toHaveLength(0);
  },
});

export { expect } from '@playwright/test';