import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { printSunmiTestReceiptAction, queryPrinterStatusAction } from '@/actions/payrix';
import * as sunmiClient from '@/lib/sunmi/client';

const setEnvVar = (key: keyof NodeJS.ProcessEnv, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

const restoreEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  restoreEnv.SUNMI_APP_ID = process.env.SUNMI_APP_ID;
  restoreEnv.SUNMI_APP_KEY = process.env.SUNMI_APP_KEY;
  restoreEnv.SUNMI_ENVIRONMENT = process.env.SUNMI_ENVIRONMENT;
  restoreEnv.SUNMI_PRINTER_SN = process.env.SUNMI_PRINTER_SN;
  process.env.SUNMI_APP_ID = 'demo-app';
  process.env.SUNMI_APP_KEY = 'secret-key';
  process.env.SUNMI_ENVIRONMENT = 'uat';
  process.env.SUNMI_PRINTER_SN = 'printer-shared';
  vi.restoreAllMocks();
});

afterEach(() => {
  setEnvVar('SUNMI_APP_ID', restoreEnv.SUNMI_APP_ID);
  setEnvVar('SUNMI_APP_KEY', restoreEnv.SUNMI_APP_KEY);
  setEnvVar('SUNMI_ENVIRONMENT', restoreEnv.SUNMI_ENVIRONMENT);
  setEnvVar('SUNMI_PRINTER_SN', restoreEnv.SUNMI_PRINTER_SN);
});

describe('platform printer admin actions', () => {
  it('returns configured printer status with model and last seen', async () => {
    const mockClient = {
      queryDevices: vi.fn().mockResolvedValue({
        code: '0',
        msg: 'ok',
        data: [
          {
            msn: 'printer-shared',
            isOnline: true,
            model: 'V2P',
            lastSeen: '2026-03-16T12:00:00Z',
          },
          {
            msn: 'other-printer',
            isOnline: false,
            model: 'V1',
          },
        ],
      }),
      print: vi.fn(),
    } as unknown as sunmiClient.SunmiCloudClient;

    vi.spyOn(sunmiClient.SunmiCloudClient, 'fromEnv').mockReturnValue(mockClient);

    const status = await queryPrinterStatusAction({ shopId: 'shop-01' });

    expect(sunmiClient.SunmiCloudClient.fromEnv).toHaveBeenCalledTimes(1);
    expect(mockClient.queryDevices).toHaveBeenCalledWith('shop-01');
    expect(status.found).toBe(true);
    expect(status.online).toBe(true);
    expect(status.model).toBe('V2P');
    expect(status.lastSeen).toBe('2026-03-16T12:00:00Z');
  });

  it('returns explicit error when printer serial is not configured', async () => {
    setEnvVar('SUNMI_PRINTER_SN', undefined);

    const status = await queryPrinterStatusAction({ shopId: 'shop-01' });

    expect(status.online).toBe(false);
    expect(status.found).toBe(false);
    expect(status.error).toBe('SUNMI_PRINTER_SN is not configured.');
  });

  it('returns skip result when test print input is missing shopId', async () => {
    const outcome = await printSunmiTestReceiptAction({ shopId: '' });

    expect(outcome.printed).toBe(false);
    expect(outcome.attempted).toBe(false);
    expect(outcome.skipped).toBe(true);
    expect(outcome.reason).toBe('Missing shopId for test print.');
  });

  it('sends sample test payload via SunmiCloudClient', async () => {
    const printMock = vi.fn().mockResolvedValue({
      code: '0',
      msg: 'ok',
      data: { ok: true },
    });

    const mockClient = {
      queryDevices: vi.fn().mockResolvedValue({
        code: '0',
        msg: 'ok',
        data: [],
      }),
      print: printMock,
    } as unknown as sunmiClient.SunmiCloudClient;

    vi.spyOn(sunmiClient.SunmiCloudClient, 'fromEnv').mockReturnValue(mockClient);

    const outcome = await printSunmiTestReceiptAction({ shopId: 'shop-01', merchantName: 'Test Shop' });

    expect(outcome.printed).toBe(true);
    expect(printMock).toHaveBeenCalledTimes(1);
    expect(printMock.mock.calls[0][0]).toBe('printer-shared');
    expect(printMock.mock.calls[0][1]).toMatch(/^[0-9A-F]+$/);
  });
});
