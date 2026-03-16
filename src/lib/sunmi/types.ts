export type SunmiEnvironment = 'production' | 'uat';

export interface SunmiResponse<TData = unknown> {
  code: string;
  data: TData;
  msg: string;
}

export interface DeviceStatus {
  msn: string;
  isOnline: boolean;
  status?: string;
  model?: string;
  lastSeen?: string;
  lastOnlineTime?: string;
  lastActiveTime?: string;
  lastHeartbeat?: string;
  lastHeartbeatAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptData {
  merchantName?: string;
  transactionId?: string;
  status?: string;
  approvalCode?: string;
  cardType?: string;
  last4?: string;
  transactionAmount?: string;
  subTotalAmount?: string;
  tipAmount?: string;
  timestamp?: string;
}

export interface PrintJob {
  id: string;
  orderId: string;
  transactionId: string;
  receiptData: ReceiptData;
  escposHex: string;
  status: 'pending' | 'queued' | 'printing' | 'printed' | 'failed';
  createdAt: string;
  updatedAt: string;
  printerMsn: string;
  errorCode?: number;
}

export interface BoundPrinter {
  msn: string;
  label: string;
  shopId: string;
  boundAt: string;
}

export interface SunmiPrinterConfig {
  appId: string;
  appKey: string;
  environment: SunmiEnvironment;
  printers: BoundPrinter[];
  defaultPrinterMsn?: string;
  shopId: string;
  callbackBaseUrl: string;
}

export interface SunmiClientConfig {
  appId: string;
  appKey: string;
  environment: SunmiEnvironment;
}
