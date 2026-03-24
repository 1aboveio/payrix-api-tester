# Design: Dual Credential Sets

**Feature:** Separate test and live credential sets that auto-swap when the global toggle fires.  
**Issue:** #320  
**Status:** Implementation  

## Motivation

Currently all credentials live in flat fields (`expressAcceptorId`, `platformApiKey`, etc.). When a merchant tests in TEST mode and wants to use LIVE mode, they must re-enter credentials. We need two independent sets.

## Config Shape

### New Types
```ts
export interface TriposCredentials {
  expressAcceptorId: string;
  expressAccountId: string;
  expressAccountToken: string;
  defaultLaneId: string;
  defaultTerminalId: string;
}

export interface PlatformCredentials {
  platformApiKey: string;
}
```

### Updated PayrixConfig
```ts
export interface PayrixConfig {
  globalEnvironment: GlobalEnvironment;
  // Legacy flat fields (kept for migration; UI writes to nested only)
  environment: PayrixEnvironment;
  platformEnvironment: 'test' | 'prod';
  tripos: { test: TriposCredentials; live: TriposCredentials };
  platform: { test: PlatformCredentials; live: PlatformCredentials };
  // Non-credential config (flat)
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  tpAuthorization: string;
  sunmiAppId: string;
  sunmiAppKey: string;
  _migrated?: boolean; // set true after first migration
}
```

## Migration

`getConfig()` — if `_migrated !== true` and old flat fields exist:
1. Copy flat fields → `tripos.test` and `tripos.live`
2. Copy `platformApiKey` → `platform.test.platformApiKey` and `platform.live.platformApiKey`
3. Set `_migrated = true` and save

After migration, old flat fields remain in `PayrixConfig` but are not updated by the UI.

## Credential Accessors (in `use-payrix-config.ts`)

```ts
export function activeTripos(config: PayrixConfig): TriposCredentials {
  return config.tripos[config.globalEnvironment];
}
export function activePlatform(config: PayrixConfig): PlatformCredentials {
  return config.platform[config.globalEnvironment];
}
```

Actions import and call these helpers instead of reading flat fields.

## Settings UI Changes

### tripos-tab.tsx
- Show two credential sections: "Test Credentials" and "Live Credentials"
- Both always visible and editable regardless of active env
- Each section has: Acceptor ID, Account ID, Account Token, Default Lane ID, Default Terminal ID
- `onFieldChange` accepts path strings like `'tripos.test.expressAcceptorId'`
- Active env badge shows which set is currently in use

### platform-tab.tsx
- Two sections: "Test API Key" and "Live API Key"
- Both always visible; API key shown as plain text (no password masking)

## Action Layer Changes

All actions currently read flat config fields. Update to use `activeTripos()` and `activePlatform()`:

- `src/actions/payrix.ts` — read via `activeTripos(config)`
- `src/actions/platform.ts` — read via `activePlatform(config)`
- `src/actions/terminal-txns.ts` — read via `activePlatform(config)`
- `src/app/lanes/connection-status/page.tsx` — read via `activeTripos`
- `src/app/lanes/create/page.tsx` — read via `activeTripos`

## onFieldChange Signature

```ts
// Old
onFieldChange: (field: keyof PayrixConfig, value: string) => void;

// New — accepts dotted paths for nested fields
onFieldChange: (field: string, value: string) => void;
```

`config.ts` gets `setNestedField(config, path, value)` helper.

## Files to Change

| File | Change |
|------|--------|
| `src/lib/payrix/types.ts` | Add `TriposCredentials`, `PlatformCredentials`, nested config fields |
| `src/lib/config.ts` | `DEFAULT_CONFIG` with nested structure; migration logic; `setNestedField` helper |
| `src/hooks/use-payrix-config.ts` | Add `activeTripos`, `activePlatform`, `updateNestedField` |
| `src/app/settings/tabs/tripos-tab.tsx` | Dual credential sections; nested field updates |
| `src/app/settings/tabs/platform-tab.tsx` | Dual credential sections; nested field updates |
| `src/actions/payrix.ts` | Use `activeTripos()` |
| `src/actions/platform.ts` | Use `activePlatform()` |
| `src/actions/terminal-txns.ts` | Use `activePlatform()` |
| `src/app/lanes/connection-status/page.tsx` | Use `activeTripos()` |
| `src/app/lanes/create/page.tsx` | Use `activeTripos()` |
| `src/app/settings/page.tsx` | Pass updated `onFieldChange` (string path) |
