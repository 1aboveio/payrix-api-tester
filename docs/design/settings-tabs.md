# Design: Split Settings into Tabs

**Issue:** #289  
**Status:** Draft  
**Author:** Alo

---

## Problem

The Settings page has grown into a single long-scroll form mixing three distinct domains:

| Current Sections | Domain |
|---|---|
| Environment, Default Request Values, Express Credentials, Application Info, tp-authorization | triPOS Cloud (transaction testing) |
| Platform API Credentials, Platform Environment | Payrix Platform (portal/admin data) |
| Sunmi Data Cloud Credentials, Printer Settings (PrinterSettingsCard) | Printer hardware |

Users (typically developers) must scroll through all three domains to find what they need. As more features are added, the page will grow further.

---

## Proposed Solution: Tabs on the Same Page

Split `/settings` into **3 tabs**, same URL, no routing changes. Use Radix UI `Tabs` (already in the component library via shadcn/ui).

### Tab Structure

```
/settings
├── Tab: triPOS Cloud        (default active)
├── Tab: Payrix Platform
└── Tab: Printer
```

#### Tab 1 — triPOS Cloud
Everything needed to test triPOS Cloud transactions:
- Environment selector (cert / prod)
- Default Request Values (Lane ID, Terminal ID)
- Express Credentials (Acceptor ID, Account ID, Account Token)
- Application Info (App ID, App Name, App Version)
- Transaction Authorization Header (tp-authorization)

#### Tab 2 — Payrix Platform
Everything needed to use the Platform REST APIs:
- Platform API Key
- Platform Environment (test / prod)

#### Tab 3 — Printer
Sunmi hardware and credentials:
- Sunmi Data Cloud Credentials (APP ID, APP Key)
- Printer Settings (`PrinterSettingsCard` component — bind/unbind, SN, etc.)

---

## Save/Reset Behavior

**Option A (recommended): Global Save/Reset buttons, persist per-tab state**
- Keep the single Save Settings / Reset to Defaults button bar at the bottom of the page
- All tabs share the same `usePayrixConfig()` hook and `config` state
- Changing a field on any tab marks the page dirty; Save commits everything
- Simple, no per-tab save state to manage

**Option B: Per-tab save**
- Each tab has its own Save button
- More isolated but adds complexity and potential for inconsistent state
- Not recommended for this tool

---

## URL / Deep-link

Tab state stored in URL param: `?tab=tripos` | `?tab=platform` | `?tab=printer`

- Default (no param): `tripos` tab active
- Unknown/invalid param: falls back to `tripos` tab (graceful handling)
- Allows deep-linking: share `?tab=printer` to send someone directly to printer settings
- Use `useSearchParams` + `router.replace` (Next.js App Router pattern)

---

## Component Structure

```
src/app/settings/page.tsx          ← Tabs wrapper, tab routing
src/app/settings/tabs/
  tripos-tab.tsx                   ← triPOS Cloud settings cards
  platform-tab.tsx                 ← Payrix Platform settings cards  
  printer-tab.tsx                  ← Sunmi creds + PrinterSettingsCard
```

Keeps `page.tsx` thin. Each tab component receives `config` + `onFieldChange` as props.

---

## UI Sketch

```
Settings
[triPOS Cloud] [Payrix Platform] [Printer]
─────────────────────────────────────────
Environment
  [cert ▼]

Default Request Values
  Lane ID [ _____ ]   Terminal ID [ _____ ]

Express Credentials
  Acceptor ID [ _____ ]   Account ID [ _____ ]
  Account Token [ _____ ]

Application Info
  App ID [ _____ ]   App Name [ _____ ]
  App Version [ _____ ]

Transaction Authorization
  tp-authorization [ Version=1.0 ]

─────────────────────────────────────────
[Save Settings]  [Reset to Defaults]
```

---

## Implementation Notes

- Use `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs` (already available via shadcn/ui)
- No new dependencies required
- All existing E2E tests continue to work — `data-testid` attributes stay on the same fields
- `environment-card` data-testid stays on the Environment card (used by E2E smoke test)

---

## Out of Scope

- Settings persistence to server/DB (still localStorage)
- Authentication/access control on settings
- Import/export of settings
