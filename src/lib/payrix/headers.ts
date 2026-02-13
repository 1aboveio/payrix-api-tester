import type { PayrixConfig } from './types';

export function buildHeaderPreview(config: PayrixConfig, includeAuthorization: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'tp-application-id': config.applicationId,
    'tp-application-name': config.applicationName,
    'tp-application-version': config.applicationVersion,
    'tp-request-id': '<generated-uuid>',
    'tp-express-acceptor-id': config.expressAcceptorId,
    'tp-express-account-id': config.expressAccountId,
    'tp-express-account-token': config.expressAccountToken,
    'Content-Type': 'application/json',
  };

  if (includeAuthorization) {
    headers['tp-authorization'] = config.tpAuthorization;
  }

  return headers;
}
