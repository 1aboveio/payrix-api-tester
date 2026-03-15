import assert from 'node:assert/strict';
import test from 'node:test';

import { generateSunmiSign } from '../sign.ts';
import { SunmiCloudClient } from '../client.ts';

test('SunmiCloudClient sends Sunmi order-notice payload keys correctly', async () => {
  const calls: Array<{ url: string; body: string }> = [];

  const client = new SunmiCloudClient(
    {
      appId: 'demo-app',
      appKey: 'secret-key',
      environment: 'uat',
    },
    {
      fetcher: async (_url, init): Promise<Response> => {
        const body = String(init?.body ?? '');
        calls.push({
          url: String(_url),
          body,
        });

        return new Response(
          JSON.stringify({
            code: '0',
            data: [],
            msg: 'ok',
          }),
          { status: 200 },
        );
      },
    },
  );

  await client.notifyNewOrder('printer-01', '77');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://uat.openapi.sunmi.com/v1/printer/newOrderNotice');

  const params = new URLSearchParams(calls[0].body);
  assert.equal(params.get('msn'), 'printer-01');
  assert.equal(params.get('hasOrder'), '1');
  assert.equal(params.get('orderId'), '77');
  assert.equal(params.has('order_id'), false);

  const sign = params.get('sign');
  assert.equal(typeof sign, 'string');

  const expectedSign = generateSunmiSign(
    {
      app_id: 'demo-app',
      timestamp: params.get('timestamp') || '',
      msn: 'printer-01',
      hasOrder: '1',
      orderId: '77',
    },
    'secret-key',
  );

  assert.equal(sign, expectedSign);
});

test('SunmiCloudClient sends call_content for voice payload', async () => {
  const calls: Array<{ url: string; body: string }> = [];

  const client = new SunmiCloudClient(
    {
      appId: 'demo-app',
      appKey: 'secret-key',
      environment: 'uat',
    },
    {
      fetcher: async (_url, init): Promise<Response> => {
        const body = String(init?.body ?? '');
        calls.push({
          url: String(_url),
          body,
        });

        return new Response(
          JSON.stringify({
            code: '0',
            data: [],
            msg: 'ok',
          }),
          { status: 200 },
        );
      },
    },
  );

  await client.pushVoice('printer-01', 'Hello, world');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://uat.openapi.sunmi.com/v1/printer/pushVoice');

  const params = new URLSearchParams(calls[0].body);
  assert.equal(params.get('msn'), 'printer-01');
  assert.equal(params.get('call_content'), 'Hello, world');
  assert.equal(params.has('content'), false);
});
