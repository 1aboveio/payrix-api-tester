# pdf-gen Refactor Design Document

**Date:** 2026-02-25
**Scope:** Document classification system, template architecture, i18n, page number formatting

---

## Changelog

| Date | Rev | Changes |
|------|-----|---------|
| 2026-02-25 | v1.5 | **Codex review fixes (final)** — (1) Guard `resolvePreset()` against missing `company.presets` (returns `null` instead of throwing). (2) Tighten `confidential_text` migration pattern: only extract label if text EXACTLY matches `"CompanyName · Label"` format; prevents misclassifying custom text like `"Top Secret · Internal Use Only"` as standard pattern. |
| 2026-02-25 | v1.4 | **Simplifications** — (1) Removed `--footer` backward compatibility; migrate to `--preset` flag only. (2) Simplified TOC title: static i18n mapping based on `default_language` (`zh-CN` → `"目录"`, `en` → `"Table of Contents"`, fallback → `"Table of Contents"`); removed `toc_title` from preset config and document language detection. (3) Removed `md_to_pdf_letterhead.sh` from file structure (obsolete). |
| 2026-02-25 | v1.3 | **Codex review fixes** — (1) Migration preserves `confidential_text` as custom `center_format` when it doesn't match standard pattern; public preset uses `standard-3col` footer to match v1 behavior. (2) Client preset `classification` corrected from `"confidential"` to `"client"`. (3) `client-footer` template conditionally includes client suffix only when `{client}` resolves non-empty. (4) `detectDocumentLanguage()` returns `null` for inconclusive input, enabling preset/company language fallback. (5) `--footer` disambiguation documented: prefers preset with ID matching classification name. (6) Sections 2.4 and 2.6 clarified for distinct purpose (concrete example vs. conceptual explanation). |
| 2026-02-25 | v1.2 | **i18n for template strings** — `page_number_formats`, `toc_title`, and `classification_label` now accept i18n objects (`{ "en": "...", "zh-CN": "..." }`) in addition to plain strings. Added `resolveI18nString()` helper for unified language resolution. Footer `center_format` uses i18n-aware `{classification}` substitution. Updated schema, examples, and implementation sections. |
| 2026-02-25 | v1.1 | **Footer layout/page-number decoupling** — Separated footer layout templates from page number format strings. Footer templates no longer contain `page_number_format`; it lives exclusively in presets or a new top-level `page_number_formats` registry. Presets mix-and-match footer layout + page number format independently. |
| 2026-02-25 | v1.1 | **Bilingual company support** — Added `default_language` field to company metadata. Added `localized_names` object for bilingual/multilingual company names. Documented interaction with TOC i18n and preset language inheritance. |
| 2026-02-25 | v1.0 | Initial design document. |

---

## 1. Current State Summary

### companies.json (flat structure)
Each company has: `name`, `logo`, `url`, `address`, `confidential_text`, `aliases`, and optionally `default_footer`.

### Footer Logic (hardcoded in `src/index.js:211-227`)
Three modes built inline:
- **public** → `"CompanyName"` or `"CompanyName · ClientName"`
- **confidential** (default) → `company.confidential` or `"CompanyName · Confidential"`
- **client** → `"CompanyName · Confidential — Prepared for ClientName"`

### Header (hardcoded in `src/index.js:198-209`)
Single HTML template with conditional client logo on the right.

### Page Numbers (hardcoded in `src/index.js:239`)
Fixed format: `Page <span class="pageNumber"></span> of <span class="totalPages"></span>`

### TOC Title (hardcoded default in `src/index.js:101`)
Default: `"Table of Contents"`. Overridable via `--toc-title` flag.

---

## 2. New JSON Schema for `companies.json`

### 2.1 Top-Level Structure

```json
{
  "$schema": "./companies.schema.json",
  "templates": { ... },
  "companies": { ... }
}
```

The file gains two top-level keys: `templates` (reusable header/footer definitions) and `companies` (company entries with preset references).

### 2.2 Templates Section

Footer layout and page number formatting are **fully decoupled**. Footer templates define only structural layout and center text formatting. Page number formatting is controlled independently via named format strings in `page_number_formats`, and selected per-preset.

This means a user can combine any footer layout (e.g., `standard-3col`) with any page number style (e.g., `minimalist`) without the two being tied together.

```json
{
  "templates": {
    "headers": {
      "single-logo": {
        "description": "Company logo on the left, optional status badge on the right",
        "layout": "single-logo"
      },
      "dual-logo": {
        "description": "Company logo left, client logo right, optional status badge",
        "layout": "dual-logo"
      }
    },
    "footers": {
      "standard-3col": {
        "description": "URL left, center text, address right, page number below",
        "layout": "three-column",
        "center_format": "{company} · {classification}"
      },
      "minimal": {
        "description": "Center text only with page number",
        "layout": "center-only",
        "center_format": "{company}"
      },
      "client-footer": {
        "description": "Standard 3-col with conditional 'Prepared for' client attribution",
        "layout": "three-column",
        "center_format": "{company} · {classification}{client_suffix}",
        "client_suffix_format": " — Prepared for {client}"
      }
    },
    "page_number_formats": {
      "standard": {
        "en": "Page {current} of {total}",
        "zh-CN": "第 {current} 页 / 共 {total} 页"
      },
      "minimalist": "{current} / {total}",
      "dash": "- {current} -"
    }
  }
}
```

**Design rationale:** Previously, `page_number_format` was embedded inside each footer template. This caused tight coupling — if you wanted `standard-3col` layout with minimalist page numbers, you had to create a new footer template. Now, presets reference a `footer` (layout) and a `page_number_format` (style) independently.

**i18n support:** Each named format in `page_number_formats` accepts either a plain string (used as-is for all languages) or an i18n object mapping locale codes to localized format strings. At render time, the format is resolved via `resolveI18nString()` (see Section 2.7). Language-neutral formats like `"{current} / {total}"` can remain as plain strings since they need no translation.

**Template variables** (resolved at render time):

| Variable | Source | Example |
|----------|--------|---------|
| `{company}` | `company.name` (or localized variant) | `"1Above"` |
| `{classification}` | Preset's `classification_label` (i18n-resolved) or titlecased classification name | `"Confidential"` / `"保密"` |
| `{client}` | `--client` flag value (resolved name) | `"Fuiou Pay"` |
| `{client_suffix}` | Rendered `client_suffix_format` when `{client}` is non-empty, otherwise empty string | `" — Prepared for Fuiou Pay"` |
| `{current}` | Puppeteer `pageNumber` | `3` |
| `{total}` | Puppeteer `totalPages` | `12` |
| `{url}` | `company.url` | `"https://1above.io"` |
| `{address}` | `company.address` | `""` |

### 2.3 Company Schema (within `companies`)

```json
{
  "companies": {
    "1above": {
      "name": "1Above",
      "logo": "1above-logo.jpg",
      "url": "https://1above.io",
      "website": "https://1above.io",
      "address": "",
      "default_language": "en",
      "aliases": ["1above consulting", "1above consulting limited"],

      "default_preset": "confidential",

      "presets": {
        "confidential": {
          "classification": "confidential",
          "classification_label": {
            "en": "Confidential",
            "zh-CN": "保密"
          },
          "header": "single-logo",
          "footer": "standard-3col",
          "page_number_format": "standard"
        },
        "public": {
          "classification": "public",
          "header": "single-logo",
          "footer": "minimal",
          "page_number_format": "minimalist"
        },
        "client": {
          "classification": "client",
          "classification_label": {
            "en": "Confidential",
            "zh-CN": "保密"
          },
          "header": "dual-logo",
          "footer": "client-footer",
          "page_number_format": "standard"
        }
      }
    }
  }
}
```

**Note:** TOC title is no longer configurable per-preset. It is automatically resolved based on the company's `default_language` (Section 5).

Note: `page_number_format` in presets now references a named format from `templates.page_number_formats` (e.g., `"standard"`, `"minimalist"`). Inline format strings are still accepted for backward compatibility — if the value contains `{current}`, it is treated as a literal format string rather than a lookup key.

### 2.4 Full Example: Bilingual Chinese-Primary Company

```json
{
  "companies": {
    "fuiou": {
      "name": "Fuiou Pay",
      "localized_names": {
        "en": "Fuiou Pay",
        "zh-CN": "富友支付"
      },
      "logo": "fuiou-pay-logo.png",
      "url": "https://www.fuioupay.com",
      "website": "https://www.fuioupay.com",
      "address": "",
      "default_language": "zh-CN",
      "aliases": ["fuiou", "fuiou pay", "fuioupay", "富友支付"],

      "default_preset": "public",

      "presets": {
        "public": {
          "classification": "public",
          "header": "single-logo",
          "footer": "minimal",
          "page_number_format": "minimalist"
        },
        "confidential": {
          "classification": "confidential",
          "classification_label": {
            "en": "Confidential",
            "zh-CN": "机密"
          },
          "header": "single-logo",
          "footer": "standard-3col",
          "page_number_format": "standard"
        }
      }
    }
  }
}
```

**TOC Title:** For Fuiou (`default_language: "zh-CN"`), all PDFs will use `"目录"` as the TOC title. For English-primary companies (`default_language: "en"`), all PDFs use `"Table of Contents"`.

### 2.5 Field Reference

#### Company Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Display name (primary language) |
| `localized_names` | no | Object mapping locale codes to localized names (e.g., `{"en": "Fuiou Pay", "zh-CN": "富友支付"}`) |
| `logo` | yes | Logo filename relative to `assets/` |
| `url` | no | URL shown in footer left column |
| `website` | no | Website URL if different from `url` (e.g., marketing site vs API domain) |
| `address` | no | Address shown in footer right column |
| `default_language` | no | BCP 47 language tag (e.g., `"en"`, `"zh-CN"`). Defaults to `"en"`. Controls which `localized_names` entry is used for `{company}` and determines TOC title. |
| `aliases` | no | Alternative names for `--company` lookup |
| `default_preset` | no | Default preset ID (falls back to `"confidential"`) |
| `presets` | no | Map of preset ID → preset config |

#### Preset Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `classification` | yes | — | Classification category. Standard values: `confidential`, `public`, `client`. |
| `classification_label` | no | Titlecased `classification` | Label used in `{classification}` template variable. Accepts `string` or i18n object `{ "en": "...", "zh-CN": "..." }`. Resolved via `resolveI18nString()` (Section 2.7). |
| `header` | no | `"single-logo"` | Header template ID |
| `footer` | no | `"standard-3col"` | Footer template ID (layout only — no page number coupling) |
| `page_number_format` | no | `"standard"` | Named format from `templates.page_number_formats`, or an inline format string containing `{current}`. Named formats may themselves be i18n objects (Section 2.2). |
| `center_format_override` | no | — | (Migration only) Custom center text that overrides the footer template's `center_format`. Set automatically when v1 `confidential_text` doesn't match the standard pattern. |
| `language` | no | Inherits `company.default_language` | Override language for this preset (affects `{company}` name resolution and TOC title) |

**Note:** `toc_title` has been removed from presets. TOC title is now determined solely by `default_language` (Section 5).

### 2.6 Bilingual / Multilingual Company Support

This section explains how bilingual/multilingual features work. For a complete concrete example, see the Fuiou entry in Section 2.4.

#### How Name Resolution Works

Companies provide localized names via the `localized_names` field. The `default_language` field determines which variant is used by default. At render time, `resolveCompanyName()` resolves the `{company}` template variable:

```javascript
function resolveCompanyName(company, preset) {
  const lang = preset?.language || company.default_language || 'en';

  // Try localized name first
  if (company.localized_names) {
    // Exact match (e.g., "zh-CN")
    if (company.localized_names[lang]) return company.localized_names[lang];

    // Base language fallback (e.g., "zh-CN" → "zh")
    const baseLang = lang.split('-')[0];
    if (company.localized_names[baseLang]) return company.localized_names[baseLang];
  }

  // Fall back to primary name
  return company.name;
}
```

**Fallback chain:** exact locale → base language → `company.name`. This ensures a value is always returned even if `localized_names` is incomplete.

#### Preset Language Inheritance

Presets **inherit** `default_language` from the parent company unless they specify their own `language` field. This allows a single company to have presets in different languages. For example, the Fuiou company in Section 2.4 could add a `confidential-en` preset with `"language": "en"` — this would cause `{company}` to resolve to `"Fuiou Pay"` instead of `"富友支付"`, and `{classification}` to resolve to `"Confidential"` instead of `"机密"`, while sharing the same i18n data objects as the Chinese preset.

With i18n objects, language-variant presets share the **same data** — language resolution picks the correct string automatically. This eliminates the need for separate `-zh` / `-en` presets when the only difference is language.

### 2.7 i18n String Resolution

All fields that accept i18n objects (`page_number_formats` values, `classification_label`) use a unified resolution helper. Plain strings are passed through unchanged for full backward compatibility.

#### i18n Object Format

```json
{
  "en": "English value",
  "zh-CN": "中文值"
}
```

Keys are BCP 47 language tags. Any number of locales can be specified.

#### Resolution Function

```javascript
/**
 * Resolve a value that may be a plain string or an i18n object.
 *
 * @param {string|object} value - Plain string or { locale: string } map
 * @param {string} language - Target language (e.g., "zh-CN", "en")
 * @returns {string} Resolved string
 */
function resolveI18nString(value, language) {
  // Plain string — pass through (v1 backward compat)
  if (typeof value === 'string') return value;

  // i18n object — resolve by language
  if (typeof value === 'object' && value !== null) {
    // 1. Exact match (e.g., "zh-CN")
    if (value[language]) return value[language];

    // 2. Base language fallback (e.g., "zh-CN" → "zh")
    const baseLang = language.split('-')[0];
    if (value[baseLang]) return value[baseLang];

    // 3. Fall back to "en"
    if (value['en']) return value['en'];

    // 4. Return first available value
    const keys = Object.keys(value);
    return keys.length > 0 ? value[keys[0]] : '';
  }

  return String(value);
}
```

#### Language Resolution Order

When determining which language to use for resolution:

1. **Preset `language` field** — if the preset has an explicit language override
2. **Company `default_language`** — the company's primary language
3. **Fall back to `"en"`**

```javascript
function resolveLanguage(preset, company) {
  return preset?.language || company?.default_language || 'en';
}
```

#### Usage in Rendering

All rendering functions call `resolveI18nString()` before substitution:

```javascript
// Resolve classification label for footer center_format
const lang = resolveLanguage(preset, company);
const classificationLabel = resolveI18nString(
  preset.classification_label || titleCase(preset.classification),
  lang
);

// Resolve page number format (may be named or inline)
const rawFormat = resolveNamedPageFormat(preset.page_number_format, templates);
const pageNumberFormat = resolveI18nString(rawFormat, lang);
```

#### Interaction with `center_format`

Footer templates use `{classification}` as a variable placeholder. The variable is substituted **after** i18n resolution, so the center text gets the correctly localized classification label:

```
center_format: "{company} · {classification}"
→ language: "zh-CN"
→ {company} = "富友支付"  (from localized_names)
→ {classification} = "机密"  (from classification_label i18n object)
→ result: "富友支付 · 机密"
```

---

## 3. Template System Architecture

### 3.1 Resolution Flow

```
CLI flags → Resolve Company → Resolve Preset → Resolve Templates → Render
```

1. `--company` → `loadCompany(id)` → company object
2. `--preset` flag → select preset by ID from `company.presets`
3. Preset's `header`/`footer` IDs → look up in `templates.headers` / `templates.footers`
4. Template `center_format` + preset overrides → final rendered strings

### 3.2 Preset Resolution Logic

```javascript
function resolvePreset(company, presetId) {
  // Guard against missing presets (schema marks it as optional)
  if (!company.presets || typeof company.presets !== 'object') {
    console.warn(`Company ${company.name} has no presets defined`);
    return null;
  }

  if (presetId && company.presets[presetId]) {
    return company.presets[presetId];
  }

  const defaultPresetId = company.default_preset || 'confidential';
  return company.presets[defaultPresetId] || company.presets['confidential'] || null;
}
```

**Simplified resolution (v1.4):** The `--preset` flag directly selects a preset by ID. There is no classification-based fallback or `--footer` compatibility mode. Users must explicitly specify `--preset <id>` or rely on the company's `default_preset`.

### 3.3 Template Rendering Pipeline

```
1. Determine effective language: resolveLanguage(preset, company)
2. Resolve company name via resolveCompanyName(company, preset)
3. Resolve classification label: resolveI18nString(preset.classification_label, lang)
4. Load footer template by ID from templates.footers
5. Get center_format from preset.center_format_override (if set) or template
6. Resolve {client_suffix}: if template has client_suffix_format AND {client} is non-empty,
   render client_suffix_format with {client}; otherwise {client_suffix} = ""
7. Substitute variables: {company}, {classification} (i18n-resolved), {client}, {client_suffix}
8. Resolve page_number_format:
   a. If preset value is a key in templates.page_number_formats → use the named format
   b. Else if preset value contains "{current}" → treat as inline format string
   c. Else → fall back to "standard" named format
9. Resolve i18n on the page number format: resolveI18nString(format, lang)
10. Substitute {current} and {total} in resolved page number format
11. Build final HTML footer string
```

For headers:
```
1. Load header template by ID from templates.headers
2. layout: "single-logo" → company logo + optional status badge
3. layout: "dual-logo" → company logo + status badge + client logo
4. Build final HTML header string
```

### 3.4 Template Extensibility

Templates are referenced by ID. New templates can be added without changing code:

```json
{
  "templates": {
    "footers": {
      "internal-only": {
        "layout": "three-column",
        "center_format": "{company} · Internal Use Only"
      }
    },
    "page_number_formats": {
      "roman": "- {current} -"
    }
  }
}
```

A preset can then combine any footer with any page number format:
```json
{ "footer": "internal-only", "page_number_format": "roman" }
```

Code only needs to know about `layout` types (`three-column`, `center-only`). Each layout type is a rendering function in `src/templates.js`.

---

## 4. Migration Path

### 4.1 Strategy: Breaking Change with Clear Migration Guide

**v1.4 removes backward compatibility** for the `--footer` flag. Users must migrate to `--preset`.

#### Migration Table

| Old Command | New Command |
|-------------|-------------|
| `md_to_pdf.sh --company 1above --footer public input.md` | `md_to_pdf.sh --company 1above --preset public input.md` |
| `md_to_pdf.sh --company 1above --footer confidential input.md` | `md_to_pdf.sh --company 1above --preset confidential input.md` |
| `md_to_pdf.sh --company 1above --footer client --client fuiou input.md` | `md_to_pdf.sh --company 1above --preset client --client fuiou input.md` |
| `md_to_pdf.sh --company 1above --footer-text "Custom" input.md` | `md_to_pdf.sh --company 1above --footer-text "Custom" input.md` (unchanged) |
| `md_to_pdf.sh --company 1above --toc-title "目录" input.md` | *(Removed)* TOC title is now determined by `default_language` |

**Migration notes:**
- The `--footer` flag is removed entirely. All usage must switch to `--preset`.
- The `--toc-title` flag is removed. TOC title is now determined by the company's `default_language` (Section 5).
- `--footer-text` remains for custom center text overrides (bypass template system).

### 4.2 v1 → v2 Auto-Migration

```javascript
function migrateV1toV2(v1Data) {
  const v2 = {
    templates: DEFAULT_TEMPLATES,  // built-in header/footer templates
    companies: {}
  };

  for (const [id, company] of Object.entries(v1Data)) {
    v2.companies[id] = {
      name: company.name,
      logo: company.logo,
      url: company.url || '',
      website: company.url || '',
      address: company.address || '',
      default_language: 'en',
      aliases: company.aliases || [],
      default_preset: company.default_footer || 'confidential',
      presets: buildDefaultPresets(company)
    };
  }

  return v2;
}
```

`buildDefaultPresets` generates three standard presets from the v1 `confidential_text` field:

```javascript
function buildDefaultPresets(company) {
  const confText = (company.confidential_text || '').trim();
  let label = 'Confidential';
  let customCenterFormat = null;

  // Only extract label if confText EXACTLY matches "CompanyName · Label" pattern
  // This prevents misclassifying custom text like "Top Secret · Internal Use Only"
  const escapedName = company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const standardPattern = new RegExp(`^${escapedName}\\s*·\\s*(.+)$`);
  const match = confText.match(standardPattern);

  if (match) {
    // Matches standard "{company} · {classification}" pattern — extract label
    label = match[1].trim();
  } else if (confText && confText !== '') {
    // Non-standard or custom confidential_text — preserve as custom center_format
    // This handles v1 companies that used confidential_text as full center text
    customCenterFormat = confText;
  }

  const confidentialPreset = {
    classification: 'confidential',
    classification_label: label,
    header: 'single-logo',
    footer: 'standard-3col',
    page_number_format: 'standard'
  };

  // Preserve non-standard confidential_text as a custom center_format override
  if (customCenterFormat) {
    confidentialPreset.center_format_override = customCenterFormat;
  }

  return {
    confidential: confidentialPreset,
    public: {
      classification: 'public',
      header: 'single-logo',
      footer: 'standard-3col',
      page_number_format: 'standard'
    },
    client: {
      classification: 'client',
      header: 'dual-logo',
      footer: 'client-footer',
      page_number_format: 'standard'
    }
  };
}
```

**Migration notes:**
- v1 companies have no `localized_names` or `default_language`. The migrator sets `default_language: "en"` as a safe default.
- Inline `page_number_format` strings from v1 presets are preserved as-is (the resolver accepts both named keys and inline format strings).
- Migrated presets use plain strings for `classification_label` — i18n objects are only added when companies explicitly configure multilingual support.
- `confidential_text` preservation: The migration uses strict pattern matching (`CompanyName · Label` exactly) to distinguish standard format from custom text. Only text that EXACTLY matches `"CompanyName · Label"` (where `CompanyName` matches `company.name`) will have the label extracted. All other non-empty text (including custom formats like `"Top Secret · Internal Use Only"`) is preserved verbatim as `center_format_override`. This ensures v1 companies that used `confidential_text` as custom center text retain their exact footer rendering. Empty `confidential_text` strings are handled gracefully (falls back to `"Confidential"` label).
- Public preset uses `standard-3col` footer (not `minimal`) to match v1 behavior.

### 4.3 CLI Changes

| Flag | v1 Behavior | v2 Behavior | Status |
|------|-------------|-------------|--------|
| `--company` | Select company | Select company | Unchanged |
| `--footer` | Select preset by classification | *(Removed)* | ❌ Breaking change |
| `--preset` | *(Not available)* | Select preset by ID | ✅ New |
| `--footer-text` | Override center text | Override center text | Unchanged |
| `--toc-title` | Override TOC title | *(Removed)* | ❌ Breaking change |
| `--client` | Resolve client name/logo | Resolve client name/logo | Unchanged |

**Breaking changes:**
1. `--footer` flag removed → must use `--preset`
2. `--toc-title` flag removed → TOC title determined by `default_language`

---

## 5. TOC Title Resolution (Simplified)

### 5.1 Static i18n Mapping

TOC title is now **statically mapped** based on the company's `default_language`:

```javascript
const TOC_TITLES = {
  'zh-CN': '目录',
  'zh': '目录',
  'en': 'Table of Contents'
};

function resolveTocTitle(company) {
  const lang = company.default_language || 'en';
  return TOC_TITLES[lang] || TOC_TITLES['en'];
}
```

**Fallback:** If the language is not in the mapping, fall back to `"Table of Contents"`.

### 5.2 Supported Languages

Initial support:
- `zh-CN` → `"目录"`
- `zh` → `"目录"`
- `en` → `"Table of Contents"`
- *(fallback)* → `"Table of Contents"`

Future languages can be added to the `TOC_TITLES` mapping without code changes.

### 5.3 Removed Features

- ❌ Document language detection (character ratio analysis)
- ❌ Per-preset `toc_title` customization
- ❌ `--toc-title` CLI flag
- ❌ `"auto"` mode

**Rationale:** Simplifies implementation and config schema. Users needing custom TOC titles can edit the source markdown (add `# Table of Contents` manually) or request a new language mapping.

---

## 6. Script & Source Changes Required

### 6.1 New File: `src/templates.js`

Responsibilities:
- Load and validate templates from `companies.json` (headers, footers, and page_number_formats)
- Provide built-in `DEFAULT_TEMPLATES` constant (used for v1 compat and as fallback)
- Render header HTML from template layout type + company/client data
- Render footer HTML from template layout type + resolved variables
- Resolve page number format (named lookup or inline passthrough), applying `resolveI18nString()` to named formats
- Substitute `{variable}` placeholders in format strings (after i18n resolution)

### 6.2 New File: `src/language.js`

Responsibilities:
- `resolveTocTitle(company)` → string (static i18n mapping based on `default_language`)
- `resolveI18nString(value, language)` → string (unified i18n resolution helper — Section 2.7)
- `resolveLanguage(preset, company)` → string (language determination helper)

**Removed from v1.3:**
- ❌ `detectDocumentLanguage()` — no longer needed

### 6.3 Modified File: `src/companies.js`

Changes:
- `loadCompany(id)` → `loadConfig(jsonPath)` + `resolveCompany(config, id)`
- Add `migrateV1toV2(v1Data)` for backward compatibility
- Add `resolvePreset(company, presetId)` (simplified: no classification fallback)
- Add `resolveCompanyName(company, preset)` for bilingual name resolution
- `normalizeCompany()` updates to handle new fields (`website`, `presets`, `default_language`, `localized_names`)
- Classification label resolution: uses `resolveI18nString()` from `language.js` when `classification_label` is an i18n object

### 6.4 Modified File: `src/index.js`

Changes:
- Replace inline footer-building logic (lines 211-227) with call to `templates.renderFooter(template, variables)`
- Replace inline header template (lines 198-209) with call to `templates.renderHeader(template, data)`
- Replace hardcoded page number format (line 239) with `preset.page_number_format`
- Replace hardcoded TOC title default (line 101) with `resolveTocTitle(company)`
- Add `--preset` flag to argument parsing
- Remove `--footer` flag
- Remove `--toc-title` flag
- Load config via new `loadConfig()` instead of direct `loadCompany()`

### 6.5 Modified File: `scripts/md_to_pdf.sh`

Changes:
- Add `--preset` flag forwarding
- Remove `--footer` flag
- Remove `--toc-title` flag

### 6.6 Removed File: `scripts/md_to_pdf_letterhead.sh`

**Removed in v1.4** (obsolete).

### 6.7 Modified File: `src/toc-generator.js`

Changes:
- Accept resolved TOC title (already supports this via `options.tocTitle`, no structural change needed)

---

## 7. File Structure Changes

```
assets/
├── companies.json              # Updated to v2 schema (backward compat with v1)
├── companies.schema.json       # NEW: JSON Schema for validation
├── 1above-logo.jpg
├── ottpay-logo.png
├── fuiou-pay-logo.png
├── fmmpay_logo.png
└── toc.css

src/
├── index.js                    # Modified: uses template system
├── companies.js                # Modified: v1/v2 loader, preset resolution
├── templates.js                # NEW: template rendering engine
├── language.js                 # NEW: i18n resolution + TOC title mapping
├── toc-generator.js            # Minor: already supports custom title
└── migrate-config.js           # NEW (optional): CLI migration tool

scripts/
├── md_to_pdf.sh                # Modified: add --preset, remove --footer/--toc-title
└── md_diff_pdf.sh              # Unchanged
```

**Removed:**
- `scripts/md_to_pdf_letterhead.sh`

---

## 8. Implementation Order

1. **`src/language.js`** — i18n resolution + static TOC title mapping (standalone, no dependencies)
2. **`src/templates.js`** — Template rendering engine (standalone)
3. **`src/companies.js`** — Refactor loader with v1/v2 support + preset resolution
4. **`assets/companies.json`** — Upgrade to v2 format
5. **`src/index.js`** — Wire up new modules, remove hardcoded logic
6. **`scripts/md_to_pdf.sh`** — Add `--preset`, remove `--footer`/`--toc-title`
7. **Remove `scripts/md_to_pdf_letterhead.sh`**
8. **`assets/companies.schema.json`** — JSON Schema (optional, for validation)
9. **`src/migrate-config.js`** — Migration CLI (optional)
10. **Tests** — Validate v1 compat, preset resolution, TOC title mapping, template rendering
11. **Migration guide** — Document breaking changes and migration steps

---

## 9. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking `--footer` usage | Clear migration guide + error message pointing to `--preset` |
| Breaking `--toc-title` usage | Document removal + explain static mapping by `default_language` |
| Users expect per-document TOC titles | Migration guide suggests editing source markdown or requesting new language mapping |
| `--preset` flag typos | Log warning if preset ID not found; fall back to `default_preset` |
| Template rendering bugs | Templates use simple string substitution; complex layouts stay as layout types in code |
| companies.json gets too large | Templates are shared/reusable; presets reference by ID, not inline |
| Page number format key typos | Resolver falls back to `"standard"` if named key not found; log a warning |
| Bilingual name missing for locale | Graceful fallback: exact locale → base language → `name` field |
| Inline vs named format ambiguity | Clear heuristic: if value contains `{current}`, treat as inline; otherwise treat as named lookup |
| i18n object missing target locale | Graceful fallback chain: exact locale → base language → `"en"` → first available key |
| Mixed plain string / i18n objects | `resolveI18nString()` handles both types transparently; v1 plain strings work unchanged |
| Removed scripts break workflows | Audit usage of `md_to_pdf_letterhead.sh` before removal |

---

## 10. Summary of v1.4 Simplifications

1. **`--footer` removed** → migrate to `--preset`
   - Cleaner API, no classification-based fallback logic
   - Direct preset selection by ID

2. **TOC title simplified** → static i18n mapping
   - No document language detection (complexity removed)
   - No per-preset customization
   - Maps `default_language` to TOC title:
     - `zh-CN` / `zh` → `"目录"`
     - `en` → `"Table of Contents"`
     - fallback → `"Table of Contents"`

3. **`md_to_pdf_letterhead.sh` removed**
   - Reduces maintenance burden
   - Consolidates to single `md_to_pdf.sh` script

These changes significantly reduce code complexity while maintaining core functionality. Users gain clarity (`--preset` is explicit) at the cost of minor migration effort.
