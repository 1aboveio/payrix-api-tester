import { generateSunmiSign, type SunmiSignInput } from './sign.ts';

import type {
  BoundPrinter,
  DeviceStatus,
  SunmiClientConfig,
  SunmiEnvironment,
  SunmiResponse,
} from './types';

type SunmiEndpointResponse<TData = unknown> = SunmiResponse<TData>;

const SUNMI_BASE_URLS: Record<SunmiEnvironment, string> = {
  production: 'https://openapi.sunmi.com',
  uat: 'https://uat.openapi.sunmi.com',
};

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
  if (environment === undefined) {
    return 'uat';
  }

  if (environment === 'production' || environment === 'uat') {
    return environment;
  }

  throw new Error(`Invalid SUNMI_ENVIRONMENT value: ${environment}.`);
}

export class SunmiCloudClient {
  private readonly baseUrl: string;
  private readonly config: SunmiClientConfig;
  private readonly options: SunmiRequestOptions;

  constructor(config: SunmiClientConfig, options: SunmiRequestOptions = {}) {
    this.config = config;
    this.options = options;
    this.baseUrl = SUNMI_BASE_URLS[this.config.environment];
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

  async bindPrinter(msn: string, shopId: string, label?: string): Promise<SunmiEndpointResponse<BoundPrinter[]>> {
    return this.post<BoundPrinter[]>('/v1/printer/printerAdd', {
      msn,
      shop_id: shopId,
      ...(label ? { label } : {}),
    });
  }

  async unbindPrinter(msn: string, shopId: string): Promise<SunmiEndpointResponse<unknown>> {
    return this.post<unknown>('/v1/printer/printerUnBind', {
      msn,
      shop_id: shopId,
    });
  }

  async queryDevices(shopId: string): Promise<SunmiEndpointResponse<DeviceStatus[]>> {
    return this.post<DeviceStatus[]>('/v1/machine/queryBindMachine', {
      shop_id: shopId,
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
