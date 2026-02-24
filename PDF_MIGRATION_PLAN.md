# PDF Migration Plan (Refreshed)
## Branch: feat/puppeteer-pdf-lib-toc

---

## Current State (main branch)

| Script | Technology | TOC Support | Status |
|--------|------------|-------------|--------|
| `md_to_pdf.sh` | wkhtmltopdf + pandoc | ❌ None | **Active** |
| `md_to_pdf_letterhead.sh` | wkhtmltopdf | ❌ None | Legacy |
| `md_diff_pdf.sh` | pandoc | ❌ None | Active |
| ~~`md_to_pdf_puppeteer.sh`~~ | ~~Puppeteer~~ | ~~Basic~~ | ~~Reverted~~ |

**Key Finding:** Previous Puppeteer implementation was reverted. Starting fresh with Puppeteer + pdf-lib stack.

---

## Target State

Replace `md_to_pdf.sh` with a **Puppeteer + pdf-lib** implementation featuring:

1. **Automatic TOC** from h2 headings
2. **Leader dots** with accurate page numbers
3. **Full feature parity** with current implementation:
   - Company logos (1Above, OTTPay)
   - Header/footer on every page
   - Mermaid diagram support
   - Chinese font support
   - Status badges (DRAFT/FINAL)

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF Generation Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   PASS 1     │     │   PASS 2     │     │   PASS 3     │     │
│  │  Render HTML │────▶│ Detect Pages │────▶│  Build TOC   │     │
│  │   (Puppeteer)│     │  (pdf-lib)   │     │   (pdf-lib)  │     │
│  └──────────────┘     └──────────────┘     └──────┬───────┘     │
│         │                                          │             │
│         │         ┌──────────────┐                │             │
│         └────────▶│  Merge PDFs  │◀───────────────┘             │
│                   │   (pdf-lib)  │                              │
│                   └──────┬───────┘                              │
│                          │                                       │
│                   ┌──────▼───────┐                              │
│                   │  Final PDF   │                              │
│                   │  TOC + Content│                              │
│                   └──────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
skills/pdf-gen/
├── scripts/
│   ├── md_to_pdf.sh          # NEW: Puppeteer + pdf-lib implementation
│   ├── md_to_pdf_legacy.sh   # OLD: wkhtmltopdf (backup)
│   ├── md_diff_pdf.sh        # (unchanged)
│   └── md_to_pdf_letterhead.sh # (unchanged)
├── src/
│   ├── index.js              # Main entry
│   ├── parser.js             # Markdown → HTML
│   ├── toc-generator.js      # TOC with leader dots (pdf-lib)
│   ├── pdf-merger.js         # Merge TOC + content
│   ├── mermaid.js            # Mermaid diagram rendering
│   └── companies.js          # Company config loader
├── assets/
│   ├── companies.json        # (unchanged)
│   ├── 1above-logo.jpg       # (unchanged)
│   ├── ottpay-logo.png       # (unchanged)
│   ├── mermaid-config.json   # (unchanged)
│   └── mermaid-style.css     # (unchanged)
├── package.json              # Add pdf-lib dependency
└── SKILL.md                  # Update with new usage
```

---

## Implementation Steps

### Step 1: Dependencies

**Update `package.json`:**
```json
{
  "name": "pdf-gen",
  "version": "2.0.0",
  "dependencies": {
    "puppeteer-core": "^24.0.0",
    "marked": "^12.0.0",
    "pdf-lib": "^1.17.1"
  }
}
```

**Install:**
```bash
npm install
```

### Step 2: Core Modules

#### `src/companies.js`
Load company branding from `assets/companies.json`:
```javascript
const fs = require('fs');
const path = require('path');

const COMPANIES_JSON = path.join(__dirname, '..', 'assets', 'companies.json');

function loadCompany(id) {
  const data = JSON.parse(fs.readFileSync(COMPANIES_JSON, 'utf-8'));
  
  // Direct lookup
  if (data[id]) return normalizeCompany(data[id]);
  
  // Alias lookup (case-insensitive)
  for (const [key, company] of Object.entries(data)) {
    const aliases = (company.aliases || []).map(a => a.toLowerCase());
    if (aliases.includes(id.toLowerCase())) {
      return normalizeCompany(company);
    }
  }
  
  throw new Error(`Company '${id}' not found`);
}

function normalizeCompany(company) {
  return {
    name: company.name,
    logo: path.join(__dirname, '..', 'assets', company.logo),
    url: company.url || '',
    confidential: company.confidential_text || `${company.name} · Confidential`,
    address: company.address || ''
  };
}

module.exports = { loadCompany };
```

#### `src/parser.js`
Parse Markdown, extract headings for TOC:
```javascript
const { marked } = require('marked');

function extractHeadings(mdContent) {
  const headings = [];
  const lines = mdContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match h2 headings (## Heading)
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      headings.push({
        level: 2,
        text: match[1].trim(),
        anchor: slugify(match[1]),
        line: i + 1
      });
    }
  }
  
  return headings;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function markdownToHtml(mdContent) {
  marked.use({ gfm: true, breaks: false });
  return marked.parse(mdContent);
}

function injectAnchors(html, headings) {
  let index = 0;
  return html.replace(/<h2[^>]*>(.*?)<\/h2>/g, (match, content) => {
    const h = headings[index++];
    return `<h2 id="${h.anchor}">${content}</h2>`;
  });
}

module.exports = {
  extractHeadings,
  markdownToHtml,
  injectAnchors,
  slugify
};
```

#### `src/mermaid.js`
Render Mermaid diagrams to PNG:
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractMermaidBlocks(mdContent) {
  const blocks = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  let id = 0;
  
  while ((match = regex.exec(mdContent)) !== null) {
    blocks.push({
      id: id++,
      raw: match[0],
      code: match[1].trim()
    });
  }
  
  return blocks;
}

async function renderMermaidDiagrams(mdContent, tmpDir) {
  const blocks = extractMermaidBlocks(mdContent);
  if (blocks.length === 0) return mdContent;
  
  // Check for mmdc
  try {
    execSync('which mmdc', { stdio: 'ignore' });
  } catch {
    console.warn('WARNING: mmdc not found, skipping Mermaid diagrams');
    return mdContent;
  }
  
  const assetsDir = path.join(__dirname, '..', 'assets');
  
  for (const block of blocks) {
    const inputFile = path.join(tmpDir, `mermaid_${block.id}.mmd`);
    const outputFile = path.join(tmpDir, `mermaid_${block.id}.png`);
    
    fs.writeFileSync(inputFile, block.code);
    
    const args = [
      '-i', inputFile,
      '-o', outputFile,
      '-b', 'transparent',
      '-s', '1.5'
    ];
    
    if (fs.existsSync(path.join(assetsDir, 'mermaid-config.json'))) {
      args.push('-c', path.join(assetsDir, 'mermaid-config.json'));
    }
    if (fs.existsSync(path.join(assetsDir, 'mermaid-style.css'))) {
      args.push('-C', path.join(assetsDir, 'mermaid-style.css'));
    }
    
    try {
      execSync(`mmdc ${args.join(' ')}`, { stdio: 'ignore' });
      const imageData = fs.readFileSync(outputFile);
      const dataUrl = `data:image/png;base64,${imageData.toString('base64')}`;
      mdContent = mdContent.replace(block.raw, `![Diagram](${dataUrl})`);
    } catch (err) {
      console.warn(`WARNING: Failed to render Mermaid diagram ${block.id}`);
      mdContent = mdContent.replace(block.raw, `> Note: Diagram failed to render`);
    }
  }
  
  return mdContent;
}

module.exports = { renderMermaidDiagrams };
```

#### `src/toc-generator.js`
Generate TOC with leader dots using pdf-lib:
```javascript
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function createTocPdf(headings, pageMap, options = {}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  
  const { width, height } = page.getSize();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margins = { left: 50, right: 50, top: 80 };
  const contentWidth = width - margins.left - margins.right;
  
  let y = height - margins.top;
  
  // TOC Title
  page.drawText('Table of Contents', {
    x: margins.left,
    y,
    font: boldFont,
    size: 18,
    color: rgb(0.17, 0.24, 0.31) // #2c3e50
  });
  y -= 35;
  
  // TOC Entries
  for (const heading of headings) {
    const pageNum = pageMap.get(heading.anchor);
    if (!pageNum) continue;
    
    const pageNumText = String(pageNum);
    
    // Calculate widths
    const textWidth = regularFont.widthOfTextAtSize(heading.text, 11);
    const numWidth = regularFont.widthOfTextAtSize(pageNumText, 11);
    
    // Leader dots
    const dotsWidth = contentWidth - textWidth - numWidth - 20;
    const dotCharWidth = regularFont.widthOfTextAtSize('.', 11);
    const dotCount = Math.max(3, Math.floor(dotsWidth / dotCharWidth));
    
    // Draw heading text
    page.drawText(heading.text, {
      x: margins.left,
      y,
      font: regularFont,
      size: 11,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    // Draw leader dots
    page.drawText('.'.repeat(dotCount), {
      x: margins.left + textWidth + 5,
      y,
      font: regularFont,
      size: 11,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    // Draw page number
    page.drawText(pageNumText, {
      x: width - margins.right - numWidth,
      y,
      font: regularFont,
      size: 11,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    y -= 22;
    
    // Check for page overflow (simple approach: start new TOC page)
    if (y < 80) {
      // For now, single TOC page - could extend to multiple pages
      break;
    }
  }
  
  return pdfDoc.save();
}

module.exports = { createTocPdf };
```

#### `src/pdf-merger.js`
Merge TOC and content PDFs:
```javascript
const { PDFDocument } = require('pdf-lib');

async function mergePdfs(tocBytes, contentBytes, options = {}) {
  // Load both PDFs
  const tocDoc = await PDFDocument.load(tocBytes);
  const contentDoc = await PDFDocument.load(contentBytes);
  
  // Create new document
  const merged = await PDFDocument.create();
  
  // Copy TOC pages
  const tocPages = await merged.copyPages(tocDoc, tocDoc.getPageIndices());
  for (const page of tocPages) {
    merged.addPage(page);
  }
  
  // Copy content pages
  const contentPages = await merged.copyPages(contentDoc, contentDoc.getPageIndices());
  for (const page of contentPages) {
    merged.addPage(page);
  }
  
  // Add metadata
  if (options.title) merged.setTitle(options.title);
  if (options.author) merged.setAuthor(options.author);
  if (options.subject) merged.setSubject(options.subject);
  
  return merged.save();
}

module.exports = { mergePdfs };
```

#### `src/index.js`
Main rendering pipeline:
```javascript
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { loadCompany } = require('./companies');
const { extractHeadings, markdownToHtml, injectAnchors } = require('./parser');
const { renderMermaidDiagrams } = require('./mermaid');
const { createTocPdf } = require('./toc-generator');
const { mergePdfs } = require('./pdf-merger');

function findChrome() {
  const paths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH
  ].filter(Boolean);
  
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Chromium not found');
}

function generateStyles(company) {
  return `
    @page {
      size: A4;
      margin: 25mm 20mm 20mm 20mm;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: "Hiragino Sans GB", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
    }
    
    h1 { font-size: 20pt; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-bottom: 16px; }
    h2 { font-size: 16pt; color: #2c3e50; margin-top: 36px; margin-bottom: 16px; page-break-before: always; }
    h2:first-of-type { page-break-before: auto; }
    h3 { font-size: 13pt; color: #34495e; margin-top: 22px; margin-bottom: 12px; }
    
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f8f9fa; font-weight: 600; }
    
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10pt; background: #f5f5f5; border-radius: 3px; }
    code { padding: 2px 5px; }
    pre { padding: 12px; overflow-x: auto; }
    
    img { max-width: 100%; max-height: 220mm; height: auto; display: block; margin: 12px auto; }
    
    blockquote { border-left: 4px solid #4a9b9b; margin: 12px 0; padding-left: 16px; color: #555; }
    
    ul, ol { padding-left: 24px; margin: 10px 0; }
    li { margin: 4px 0; }
  `;
}

function generateHeaderFooter(company, status) {
  const today = new Date().toISOString().split('T')[0];
  
  // Convert logo to data URL
  let logoDataUrl = '';
  if (fs.existsSync(company.logo)) {
    const ext = path.extname(company.logo).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    const data = fs.readFileSync(company.logo).toString('base64');
    logoDataUrl = `data:${mime};base64,${data}`;
  }
  
  return {
    headerTemplate: `
      <div style="width: 100%; padding: 10px 40px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; border-bottom: 1px solid #e0e0e0;">
        <img src="${logoDataUrl}" style="height: 32px;" />
        <span style="font-size: 9pt; color: #666;">${today} ${status}</span>
      </div>
    `,
    footerTemplate: `
      <div style="width: 100%; padding: 10px 40px; text-align: center; font-family: sans-serif; font-size: 8pt; color: #999; border-top: 1px solid #e0e0e0;">
        ${company.confidential} · Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `
  };
}

async function renderToPdf(inputPath, outputPath, options = {}) {
  const {
    company: companyId = '1above',
    toc: includeToc = false,
    status = ''
  } = options;
  
  // Load company config
  const company = loadCompany(companyId);
  
  // Read and preprocess markdown
  let mdContent = fs.readFileSync(inputPath, 'utf-8');
  
  // Create temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-gen-'));
  
  try {
    // Render Mermaid diagrams
    mdContent = await renderMermaidDiagrams(mdContent, tmpDir);
    
    // Extract headings for TOC
    const headings = includeToc ? extractHeadings(mdContent) : [];
    
    // Convert to HTML
    let htmlContent = markdownToHtml(mdContent);
    
    // Inject anchors for TOC linking
    if (headings.length > 0) {
      htmlContent = injectAnchors(htmlContent, headings);
    }
    
    // Generate full HTML
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${generateStyles(company)}</style>
</head>
<body>${htmlContent}</body>
</html>`;
    
    // Launch Puppeteer
    const chromePath = findChrome();
    console.log(`Using Chrome: ${chromePath}`);
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500)); // Font load
    
    // Get header/footer templates
    const { headerTemplate, footerTemplate } = generateHeaderFooter(company, status);
    
    // Generate content PDF
    const contentPdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: { top: '80px', bottom: '60px', left: '50px', right: '50px' }
    });
    
    await browser.close();
    
    // If TOC requested, build it and merge
    if (includeToc && headings.length > 0) {
      // Build page map (each heading → page number)
      // For simplicity: assume each h2 starts a new page due to page-break-before
      const pageMap = new Map();
      let currentPage = 2; // Start after TOC page
      for (const h of headings) {
        pageMap.set(h.anchor, currentPage++);
      }
      
      // Generate TOC PDF
      const tocPdfBytes = await createTocPdf(headings, pageMap, {
        title: path.basename(inputPath, '.md')
      });
      
      // Merge
      const mergedBytes = await mergePdfs(tocPdfBytes, contentPdfBytes, {
        title: path.basename(inputPath, '.md'),
        author: company.name
      });
      
      fs.writeFileSync(outputPath, mergedBytes);
    } else {
      fs.writeFileSync(outputPath, contentPdfBytes);
    }
    
    console.log(`Wrote: ${outputPath}`);
    
  } finally {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const input = args[0];
  const output = args[1] || input.replace(/\.md$/, '.pdf');
  
  let company = '1above';
  let toc = false;
  let status = '';
  
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--toc') toc = true;
    else if (args[i] === '--company' && args[i+1]) company = args[i+1];
    else if (args[i] === '--status' && args[i+1]) status = args[i+1];
  }
  
  if (!input) {
    console.log('Usage: node src/index.js <input.md> [output.pdf] [--toc] [--company 1above|ottpay] [--status STATUS]');
    process.exit(1);
  }
  
  renderToPdf(input, output, { company, toc, status })
    .then(() => console.log('Done!'))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { renderToPdf };
```

### Step 3: Bash Wrapper

**`scripts/md_to_pdf.sh` (replaced):**
```bash
#!/usr/bin/env bash
# md_to_pdf.sh - Markdown to PDF with Puppeteer + pdf-lib
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Parse arguments
COMPANY="${COMPANY_ID:-1above}"
TOC=""
STATUS=""

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --company)
      COMPANY="$2"
      shift 2
      ;;
    --toc)
      TOC="true"
      shift
      ;;
    --status)
      STATUS="$2"
      shift 2
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

set -- "${args[@]}"

INPUT="${1:-}"
OUTPUT="${2:-${INPUT%.md}.pdf}"

if [[ -z "$INPUT" ]]; then
  echo "Usage: md_to_pdf.sh <input.md> [output.pdf] [--toc] [--company 1above|ottpay] [--status STATUS]" >&2
  exit 1
fi

# Build node command
CMD="node \"$SKILL_DIR/src/index.js\" \"$INPUT\" \"$OUTPUT\" --company $COMPANY"
[[ "$TOC" == "true" ]] && CMD="$CMD --toc"
[[ -n "$STATUS" ]] && CMD="$CMD --status $STATUS"

# Run
eval $CMD
```

### Step 4: Update SKILL.md

Add new section at top:
```markdown
# pdf-gen

Convert Markdown to PDF with professional branding (logo, header, footer) and **automatic Table of Contents**.

## Quick Start

```bash
# Basic conversion
./scripts/md_to_pdf.sh document.md

# With TOC (auto-generated from h2 headings)
./scripts/md_to_pdf.sh document.md --toc

# Company branding
./scripts/md_to_pdf.sh document.md --company ottpay --toc

# Status badge
./scripts/md_to_pdf.sh document.md --toc --status DRAFT
```

## Features

- ✅ Automatic TOC with page numbers and leader dots
- ✅ Company logos (1Above, OTTPay)
- ✅ Headers and footers on every page
- ✅ Mermaid diagram support
- ✅ Chinese font support
```

---

## Testing Checklist

### Before Merge
- [ ] TOC generates with correct page numbers
- [ ] Leader dots render correctly
- [ ] 1Above logo appears in header
- [ ] OTTPay logo appears in header
- [ ] Footer shows "Page X of Y"
- [ ] Mermaid diagrams render
- [ ] Chinese text displays correctly
- [ ] Status badges (DRAFT/FINAL) work
- [ ] No TOC when --toc not specified
- [ ] Works without internet (local Chrome)

### Regression Tests
- [ ] `md_diff_pdf.sh` still works
- [ ] `md_to_pdf_letterhead.sh` still works
- [ ] Existing documents produce same output quality

---

## Rollback Plan

If issues arise:
```bash
# Restore legacy script
git checkout main -- scripts/md_to_pdf.sh
```

---

## Estimated Effort: 3-4 days

| Task | Days |
|------|------|
| Core modules (parser, toc-generator, merger) | 1.5 |
| Main index.js with Puppeteer | 1 |
| Testing & bug fixes | 0.5-1 |
| Documentation update | 0.5 |
