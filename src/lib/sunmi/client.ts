import { createHash } from 'node:crypto';

import { generateDataCloudSign, generateSunmiSign, type SunmiSignInput } from './sign';

import type {
  BoundPrinter,
  DeviceStatus,
  SunmiClientConfig,
  SunmiDataCloudConfig,
  SunmiEnvironment,
  SunmiResponse,
} from './types';

type SunmiEndpointResponse<TData = unknown> = SunmiResponse<TData>;

// V1 API base URLs (openapi.sunmi.com) — used for print, status, etc.
const SUNMI_V1_BASE_URLS: Record<SunmiEnvironment, string> = {
  production: 'https://openapi.sunmi.com',
  uat: 'https://uat.openapi.sunmi.com',
};

// Data Cloud API base URLs (store.sunmi.com) — used for shop bind/unbind
const SUNMI_DATA_CLOUD_BASE_URLS: Record<SunmiEnvironment, string> = {
  production: 'https://store.sunmi.com/openapi',
  uat: 'https://store.uat.sunmi.com/openapi',
};

const PRINT_ENDPOINT = '/v1/printer/print';

interface SunmiRequestOptions {
  fetcher?: typeof fetch;
}

interface BaseEndpointRequest {
  app_id: string;
  timestamp: string;
  sign: string;
  [key: string]: string;
}

function resolveSunmiEnvironment(environment: string | undefined): SunmiEnvironment {
  if (environment === 'production' || environment === 'uat') {
    return environment;
  }

  throw new Error(`Invalid SUNMI_ENVIRONMENT value: ${environment}.`);
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = new Uint8Array(length);
  // Use a fixed seed for deterministic output in tests; in production use crypto.getRandomValues
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

// ---------------------------------------------------------------------------
// SunmiDataCloudClient — shop bind/unbind (store.sunmi.com)
// ---------------------------------------------------------------------------

export interface ShopBindParams {
  /** Third-party shop ID (from our system) */
  shopId: string;
  /** Third-party company/merchant ID */
  companyId: string;
  /** Shop name */
  shopName: string;
  /** Company/merchant name */
  companyName: string;
  /** Sunmi Digital Store 对接店铺编号 */
  sunmiShopNo: string;
  /** Sunmi Digital Store 对接店铺密钥 (24h expiry) */
  sunmiShopKey: string;
  /** Contact person name */
  contactPerson: string;
  /** Contact phone number */
  phone: string;
  /** Printer serial number (MSN) */
  msn: string;
  /** Optional printer label */
  label?: string;
}

export interface ShopBindResponse {
  code: string;
  data: { shop_id: string } | null;
  msg: string;
}

export interface ShopUnbindParams {
  shopId: string;
  companyId: string;
  sunmiShopNo: string;
  /** Printer serial number (MSN) — optional per docs */
  msn?: string;
}

export class SunmiDataCloudClient {
  private readonly baseUrl: string;
  private readonly config: SunmiDataCloudConfig;
  private readonly options: SunmiRequestOptions;

  constructor(config: SunmiDataCloudConfig, options: SunmiRequestOptions = {}) {
    this.config = config;
    this.options = options;
    this.baseUrl = SUNMI_DATA_CLOUD_BASE_URLS[this.config.environment];
  }

  static fromEnv(environment = process.env.SUNMI_ENVIRONMENT): SunmiDataCloudClient {
    const env = resolveSunmiEnvironment(environment);
    const appId = process.env.SUNMI_APP_ID;
    const appKey = process.env.SUNMI_APP_KEY;

    if (!appId || !appKey) {
      throw new Error('Sunmi credentials are missing (SUNMI_APP_ID and SUNMI_APP_KEY).');
    }

    return new SunmiDataCloudClient({ appId, appKey, environment: env });
  }

  /**
   * Bind a printer to a shop in Sunmi Data Cloud.
   * Endpoint: POST /shop/bind
   * Signing: MD5(sorted_pairs + "&key=" + appKey) → uppercase
   */
  async bindShop(params: ShopBindParams): Promise<ShopBindResponse> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const random = generateRandomString(8);

    const signParams: SunmiSignInput = {
      app_id: this.config.appId,
      company_id: params.companyId,
      company_name: params.companyName,
      contact_person: params.contactPerson,
      msn: params.msn,
      phone: params.phone,
      shop_id: params.shopId,
      shop_name: params.shopName,
      sunmi_shop_key: params.sunmiShopKey,
      sunmi_shop_no: params.sunmiShopNo,
      timestamp,
      random,
      ...(params.label ? { label: params.label } : {}),
    };

    const sign = generateDataCloudSign(signParams, this.config.appKey);

    const payload: Record<string, string> = {
      app_id: this.config.appId,
      company_id: params.companyId,
      company_name: params.companyName,
      contact_person: params.contactPerson,
      msn: params.msn,
      phone: params.phone,
      shop_id: params.shopId,
      shop_name: params.shopName,
      sunmi_shop_key: params.sunmiShopKey,
      sunmi_shop_no: params.sunmiShopNo,
      timestamp,
      random,
      sign,
    };

    if (params.label) {
      payload.label = params.label;
    }

    return this.post<ShopBindResponse>('/shop/bind', payload);
  }

  /**
   * Unbind a shop from Sunmi Data Cloud.
   * Endpoint: POST /shop/unbind
   */
  async unbindShop(params: ShopUnbindParams): Promise<SunmiEndpointResponse<unknown>> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const random = generateRandomString(8);

    const signParams: SunmiSignInput = {
      app_id: this.config.appId,
      company_id: params.companyId,
      shop_id: params.shopId,
      sunmi_shop_no: params.sunmiShopNo,
      timestamp,
      random,
      ...(params.msn ? { msn: params.msn } : {}),
    };

    const sign = generateDataCloudSign(signParams, this.config.appKey);

    const payload: Record<string, string> = {
      app_id: this.config.appId,
      company_id: params.companyId,
      shop_id: params.shopId,
      sunmi_shop_no: params.sunmiShopNo,
      timestamp,
      random,
      sign,
    };

    if (params.msn) {
      payload.msn = params.msn;
    }

    return this.post<SunmiEndpointResponse<unknown>>('/shop/unbind', payload);
  }

  private async post<TData>(endpoint: string, payload: Record<string, string>): Promise<TData> {
    const formBody = this.toFormData(payload);
    const response = await this.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formBody,
    });

    const bodyText = await response.text();

    if (!response.ok) {
      throw new Error(`Sunmi Data Cloud API request failed: ${response.status} ${response.statusText}`);
    }

    if (!bodyText) {
      throw new Error('Sunmi Data Cloud API returned empty response body');
    }

    try {
      return JSON.parse(bodyText) as TData;
    } catch {
      throw new Error(`Sunmi Data Cloud API returned non-JSON payload: ${bodyText}`);
    }
  }

  private toFormData(payload: Record<string, string>): string {
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      form.set(key, String(value));
    });
    return form.toString();
  }

  private fetch(endpoint: string, init: RequestInit): Promise<Response> {
    const requestUrl = `${this.baseUrl}${endpoint}`;
    const fetcher = this.options.fetcher ?? fetch;
    return fetcher(requestUrl, init);
  }
}

// ---------------------------------------------------------------------------
// SunmiCloudClient — V1 API (openapi.sunmi.com) — kept for print/status ops
// ---------------------------------------------------------------------------

export class SunmiCloudClient {
  private readonly baseUrl: string;
  private readonly config: SunmiClientConfig;
  private readonly options: SunmiRequestOptions;

  constructor(config: SunmiClientConfig, options: SunmiRequestOptions = {}) {
    this.config = config;
    this.options = options;
    this.baseUrl = SUNMI_V1_BASE_URLS[this.config.environment];
  }

  static fromEnv(environment = process.env.SUNMI_ENVIRONMENT): SunmiCloudClient {
    const env = resolveSunmiEnvironment(environment);
    const appId = process.env.SUNMI_APP_ID;
    const appKey = process.env.SUNMI_APP_KEY;

    if (!appId || !appKey) {
      throw new Error('Sunmi credentials are missing (SUNMI_APP_ID and SUNMI_APP_KEY).');
    }

    return new SunmiCloudClient({ appId, appKey, environment: env });
  }

  async queryDevices(shopId: string): Promise<SunmiEndpointResponse<DeviceStatus[]>> {
    return this.post<DeviceStatus[]>('/v1/machine/queryBindMachine', {
      shop_id: shopId,
    });
  }

  async print(msn: string, contentHex: string): Promise<SunmiEndpointResponse<unknown>> {
    return this.post<unknown>(PRINT_ENDPOINT, {
      msn,
      printType: 'ESC_POS',
      content: contentHex,
    });
  }

  async notifyNewOrder(msn: string, orderId: number | string): Promise<SunmiEndpointResponse<unknown>> {
    return this.post<unknown>('/v1/printer/newOrderNotice', {
      msn,
      hasOrder: '1',
      orderId: String(orderId),
    });
  }

  async pushVoice(msn: string, content: string): Promise<SunmiEndpointResponse<unknown>> {
    return this.post<unknown>('/v1/printer/pushVoice', {
      msn,
      call_content: content,
    });
  }

  private async post<TData>(endpoint: string, payload: Record<string, string>): Promise<SunmiEndpointResponse<TData>> {
    const requestBody = this.withSign(payload);
    const formBody = this.toFormData(requestBody);
    const response = await this.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formBody,
    });

    const bodyText = await response.text();
    const parsed = this.parseResponse<TData>(bodyText);

    if (!response.ok) {
      throw new Error(`Sunmi API request failed: ${response.status} ${response.statusText}`);
    }

    return parsed;
  }

  private withSign(payload: Record<string, string>): BaseEndpointRequest {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: SunmiSignInput = {
      app_id: this.config.appId,
      timestamp,
      ...payload,
    };

    const sign = generateSunmiSign(params, this.config.appKey);

    return {
      ...payload,
      app_id: this.config.appId,
      timestamp,
      sign,
    } as BaseEndpointRequest;
  }

  private toFormData(payload: BaseEndpointRequest): string {
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      form.set(key, String(value));
    });

    return form.toString();
  }

  private async parseResponse<TData>(body: string): Promise<SunmiEndpointResponse<TData>> {
    if (!body) {
      return {
        code: 'EMPTY_RESPONSE',
        data: '' as unknown as TData,
        msg: 'Sunmi API returned empty response body',
      };
    }

    try {
      return JSON.parse(body) as SunmiEndpointResponse<TData>;
    } catch {
      return {
        code: 'INVALID_JSON',
        data: '' as unknown as TData,
        msg: 'Sunmi API returned non-JSON payload',
      };
    }
  }

  private fetch(endpoint: string, init: RequestInit): Promise<Response> {
    const requestUrl = `${this.baseUrl}${endpoint}`;
    const fetcher = this.options.fetcher ?? fetch;
    return fetcher(requestUrl, init);
  }
}
