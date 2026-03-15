import { describe, expect, it } from 'vitest';

import { SunmiCloudClient } from '../client';

describe('SunmiCloudClient requests', () => {
  it('notifyNewOrder sends hasOrder and orderId payload keys', async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const client = new SunmiCloudClient(
      {
        appId: 'demo-app',
        appKey: 'secret-key',
        environment: 'uat',
      },
      {
        fetcher: async (url, init): Promise<Response> => {
          calls.push({
            url: String(url),
            body: String(init?.body ?? ''),
          });

          return new Response(
            JSON.stringify({
              code: '0',
              data: { ok: true },
              msg: 'ok',
            }),
            { status: 200 },
          );
        },
      },
    );

    await client.notifyNewOrder('printer-01', 555);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://uat.openapi.sunmi.com/v1/printer/newOrderNotice');

    const params = new URLSearchParams(calls[0].body);
    expect(params.get('msn')).toBe('printer-01');
    expect(params.get('hasOrder')).toBe('1');
    expect(params.get('orderId')).toBe('555');
  });

  it('pushVoice sends call_content payload key', async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const client = new SunmiCloudClient(
      {
        appId: 'demo-app',
        appKey: 'secret-key',
        environment: 'uat',
      },
      {
        fetcher: async (url, init): Promise<Response> => {
          calls.push({
            url: String(url),
            body: String(init?.body ?? ''),
          });

          return new Response(
            JSON.stringify({
              code: '0',
              data: { ok: true },
              msg: 'ok',
            }),
            { status: 200 },
          );
        },
      },
    );

    await client.pushVoice('printer-01', 'Welcome');

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://uat.openapi.sunmi.com/v1/printer/pushVoice');

    const params = new URLSearchParams(calls[0].body);
    expect(params.get('msn')).toBe('printer-01');
    expect(params.get('call_content')).toBe('Welcome');
  });
});
