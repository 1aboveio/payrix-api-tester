// Certification test case templates aligned with triPOS certification script.
// Each endpoint has predefined templates with amounts/flags matching certification requirements.

export interface TestCaseTemplate {
  id: string;
  name: string;
  description: string;
  fields: Record<string, unknown>;
}

export interface EndpointTemplates {
  endpoint: string;
  templates: TestCaseTemplate[];
}

// ---------------------------------------------------------------------------
// Sale templates (S-1..S-10 + Level 2 + Duplicate)
// ---------------------------------------------------------------------------
export const saleTemplates: TestCaseTemplate[] = [
  {
    id: 's-1-swipe-credit',
    name: 'S-1 Swiped Credit ($1.04)',
    description: 'CP swiped credit card sale — Approved',
    fields: { transactionAmount: '1.04' },
  },
  {
    id: 's-2-swipe-partial',
    name: 'S-2 Swiped Credit Partial ($9.65)',
    description: 'Partial approval (allowPartialApprovals)',
    fields: { transactionAmount: '9.65', configuration: { allowPartialApprovals: true } },
  },
  {
    id: 's-3-swipe-balance',
    name: 'S-3 Swiped Credit Balance ($32.00)',
    description: 'Balance response scenario',
    fields: { transactionAmount: '32.00' },
  },
  {
    id: 's-4-swipe-debit',
    name: 'S-4 Swiped PIN Debit ($31.00)',
    description: 'PIN debit sale',
    fields: { transactionAmount: '31.00' },
  },
  {
    id: 's-5-swipe-debit-cashback',
    name: 'S-5 Swiped PIN Debit + Cash Back ($31.00 + $1.00)',
    description: 'Debit sale with cash back',
    fields: { transactionAmount: '31.00', cashBackAmount: '1.00' },
  },
  {
    id: 's-6-emv-insert',
    name: 'S-6 EMV Insert ($1.06)',
    description: 'EMV insert sale',
    fields: { transactionAmount: '1.06' },
  },
  {
    id: 's-7-contactless',
    name: 'S-7 Contactless EMV ($1.08)',
    description: 'Contactless/NFC sale',
    fields: { transactionAmount: '1.08' },
  },
  {
    id: 's-8-keyed',
    name: 'S-8 Keyed Credit ($1.07)',
    description: 'Manual key entry sale',
    fields: { transactionAmount: '1.07', invokeManualEntry: true },
  },
  {
    id: 's-9-keyed-partial',
    name: 'S-9 Keyed Partial ($9.65)',
    description: 'Keyed sale partial approval',
    fields: { transactionAmount: '9.65', invokeManualEntry: true, configuration: { allowPartialApprovals: true } },
  },
  {
    id: 's-10-keyed-balance',
    name: 'S-10 Keyed Balance ($32.00)',
    description: 'Keyed sale balance response',
    fields: { transactionAmount: '32.00', invokeManualEntry: true },
  },
  {
    id: 'l2s-1-swipe',
    name: 'L2S-1 Level 2 Sale Swipe ($3.00)',
    description: 'Level 2 sale with required fields',
    fields: {
      transactionAmount: '3.00',
      salesTaxAmount: '0.25',
      commercialCardCustomerCode: 'PO123456',
      shippingZipcode: '90210',
      billingName: 'Test Business Inc',
    },
  },
  {
    id: 'l2s-2-emv',
    name: 'L2S-2 Level 2 Sale EMV ($4.00)',
    description: 'Level 2 sale with required fields (EMV insert)',
    fields: {
      transactionAmount: '4.00',
      salesTaxAmount: '0.30',
      commercialCardCustomerCode: 'PO123457',
      shippingZipcode: '90210',
      billingName: 'Test Business Inc',
    },
  },
  {
    id: 'dup-1-sale',
    name: 'DUP-1 Sale ($1.70)',
    description: 'Baseline sale for duplicate test',
    fields: { transactionAmount: '1.70' },
  },
  {
    id: 'dup-2-duplicate',
    name: 'DUP-2 Duplicate Sale ($1.70)',
    description: 'Duplicate sale with checkForDuplicateTransactions',
    fields: { transactionAmount: '1.70', checkForDuplicateTransactions: true },
  },
  {
    id: 'dup-3-override',
    name: 'DUP-3 Override Duplicate ($1.70)',
    description: 'Duplicate override using duplicateCheckDisableFlag',
    fields: { transactionAmount: '1.70', duplicateCheckDisableFlag: true },
  },
  {
    id: 'tip-preset',
    name: 'Sale with Pre-set Tip ($50 + $10)',
    description: 'Sale with merchant-specified tip amount',
    fields: { transactionAmount: '50.00', tipAmount: '10.00' },
  },
  {
    id: 'tip-pinpad-percent',
    name: 'Sale with PIN Pad Tip (Percentages)',
    description: 'Sale with PIN Pad tip options (15%, 18%, 20%, none)',
    fields: { transactionAmount: '50.00', configuration: { enableTipPrompt: true, tipPromptOptions: ['15', '18', '20', 'none'] } },
  },
  {
    id: 'tip-pinpad-fixed',
    name: 'Sale with PIN Pad Tip (Fixed)',
    description: 'Sale with PIN Pad tip options ($5, $10, other)',
    fields: { transactionAmount: '50.00', configuration: { enableTipPrompt: true, tipPromptOptions: ['5.00', '10.00', 'other'] } },
  },
];

// ---------------------------------------------------------------------------
// Authorization templates (A-1..A-8 + Level 2)
// ---------------------------------------------------------------------------
export const authorizationTemplates: TestCaseTemplate[] = [
  {
    id: 'a-1-swipe-credit',
    name: 'A-1 Swiped Credit ($1.04)',
    description: 'CP swiped credit authorization',
    fields: { transactionAmount: '1.04' },
  },
  {
    id: 'a-2-swipe-partial',
    name: 'A-2 Swiped Partial ($9.65)',
    description: 'Partial approval authorization',
    fields: { transactionAmount: '9.65', configuration: { allowPartialApprovals: true } },
  },
  {
    id: 'a-3-swipe-balance',
    name: 'A-3 Swiped Balance ($32.00)',
    description: 'Balance response authorization',
    fields: { transactionAmount: '32.00' },
  },
  {
    id: 'a-4-contactless',
    name: 'A-4 Contactless EMV ($1.08)',
    description: 'Contactless/NFC authorization',
    fields: { transactionAmount: '1.08' },
  },
  {
    id: 'a-5-emv-insert',
    name: 'A-5 EMV Insert ($1.06)',
    description: 'EMV insert authorization',
    fields: { transactionAmount: '1.06' },
  },
  {
    id: 'a-6-keyed',
    name: 'A-6 Keyed Credit ($1.07)',
    description: 'Manual key entry authorization',
    fields: { transactionAmount: '1.07', invokeManualEntry: true },
  },
  {
    id: 'a-7-keyed-partial',
    name: 'A-7 Keyed Partial ($9.65)',
    description: 'Keyed authorization partial approval',
    fields: { transactionAmount: '9.65', invokeManualEntry: true, configuration: { allowPartialApprovals: true } },
  },
  {
    id: 'a-8-keyed-balance',
    name: 'A-8 Keyed Balance ($32.00)',
    description: 'Keyed authorization balance response',
    fields: { transactionAmount: '32.00', invokeManualEntry: true },
  },
  {
    id: 'l2a-1-swipe',
    name: 'L2A-1 Level 2 Auth Swipe ($5.00)',
    description: 'Level 2 authorization with required fields',
    fields: {
      transactionAmount: '5.00',
      salesTaxAmount: '0.40',
      commercialCardCustomerCode: 'PO789012',
      shippingZipcode: '90210',
      billingName: 'Test Business Inc',
    },
  },
  {
    id: 'l2a-2-emv',
    name: 'L2A-2 Level 2 Auth EMV ($6.00)',
    description: 'Level 2 authorization with required fields (EMV insert)',
    fields: {
      transactionAmount: '6.00',
      salesTaxAmount: '0.50',
      commercialCardCustomerCode: 'PO789013',
      shippingZipcode: '90210',
      billingName: 'Test Business Inc',
    },
  },
];

// ---------------------------------------------------------------------------
// Completion templates (C-1..C-8)
// ---------------------------------------------------------------------------
export const completionTemplates: TestCaseTemplate[] = [
  {
    id: 'c-1-swipe',
    name: 'C-1 Completion Swipe ($1.04)',
    description: 'Completion of swiped credit auth',
    fields: { transactionAmount: '1.04' },
  },
  {
    id: 'c-2-swipe-partial',
    name: 'C-2 Completion Partial ($6.10)',
    description: 'Partial completion amount (from $9.65 auth)',
    fields: { transactionAmount: '6.10' },
  },
  {
    id: 'c-3-swipe-balance',
    name: 'C-3 Completion Balance ($32.00)',
    description: 'Completion balance response',
    fields: { transactionAmount: '32.00' },
  },
  {
    id: 'c-4-contactless',
    name: 'C-4 Completion Contactless ($1.08)',
    description: 'Completion of contactless auth',
    fields: { transactionAmount: '1.08' },
  },
  {
    id: 'c-5-emv',
    name: 'C-5 Completion EMV ($1.06)',
    description: 'Completion of EMV auth',
    fields: { transactionAmount: '1.06' },
  },
  {
    id: 'c-6-keyed',
    name: 'C-6 Completion Keyed ($1.07)',
    description: 'Completion of keyed auth',
    fields: { transactionAmount: '1.07' },
  },
  {
    id: 'c-7-keyed-partial',
    name: 'C-7 Completion Keyed Partial ($6.10)',
    description: 'Partial completion amount (from $9.65 keyed auth)',
    fields: { transactionAmount: '6.10' },
  },
  {
    id: 'c-8-keyed-balance',
    name: 'C-8 Completion Keyed Balance ($32.00)',
    description: 'Completion balance response (keyed)',
    fields: { transactionAmount: '32.00' },
  },
];

// ---------------------------------------------------------------------------
// Void templates (V-1..V-4)
// ---------------------------------------------------------------------------
export const voidTemplates: TestCaseTemplate[] = [
  {
    id: 'v-1-swipe',
    name: 'V-1 Void Swiped Sale ($1.00)',
    description: 'Void swiped credit sale',
    fields: {},
  },
  {
    id: 'v-2-contactless',
    name: 'V-2 Void Contactless Sale ($1.00)',
    description: 'Void contactless EMV sale',
    fields: {},
  },
  {
    id: 'v-3-emv',
    name: 'V-3 Void EMV Sale ($1.00)',
    description: 'Void EMV insert sale',
    fields: {},
  },
  {
    id: 'v-4-keyed',
    name: 'V-4 Void Keyed Sale ($1.00)',
    description: 'Void keyed sale',
    fields: {},
  },
];

// ---------------------------------------------------------------------------
// Return templates (RT-1..RT-5)
// ---------------------------------------------------------------------------
export const returnTemplates: TestCaseTemplate[] = [
  {
    id: 'rt-1-swipe',
    name: 'RT-1 Return Swiped ($1.04)',
    description: 'Full return for swiped sale',
    fields: { transactionAmount: '1.04' },
  },
  {
    id: 'rt-2-contactless',
    name: 'RT-2 Return Contactless ($1.08)',
    description: 'Full return for contactless sale',
    fields: { transactionAmount: '1.08' },
  },
  {
    id: 'rt-3-keyed',
    name: 'RT-3 Return Keyed ($1.07)',
    description: 'Full return for keyed sale',
    fields: { transactionAmount: '1.07' },
  },
  {
    id: 'rt-4-partial-swipe',
    name: 'RT-4 Partial Return Swiped ($0.50)',
    description: 'Partial return for swiped sale',
    fields: { transactionAmount: '0.50' },
  },
  {
    id: 'rt-5-partial-keyed',
    name: 'RT-5 Partial Return Keyed ($0.53)',
    description: 'Partial return for keyed sale',
    fields: { transactionAmount: '0.53' },
  },
];

// ---------------------------------------------------------------------------
// Refund templates (linked refunds; keep minimal)
// ---------------------------------------------------------------------------
export const refundTemplates: TestCaseTemplate[] = [
  {
    id: 'refund-full',
    name: 'Refund – Full Amount',
    description: 'Linked refund for full sale amount',
    fields: {},
  },
  {
    id: 'refund-partial',
    name: 'Refund – Partial Amount ($0.50)',
    description: 'Linked refund for partial amount',
    fields: { transactionAmount: '0.50' },
  },
];

// ---------------------------------------------------------------------------
// Reversal templates (RV-1..RV-6)
// ---------------------------------------------------------------------------
export const reversalTemplates: TestCaseTemplate[] = [
  {
    id: 'rv-1-swipe',
    name: 'RV-1 Reversal Swiped ($1.00)',
    description: 'Full reversal for swiped credit sale/auth',
    fields: {},
  },
  {
    id: 'rv-2-debit',
    name: 'RV-2 Reversal Debit ($31.00)',
    description: 'Full reversal for swiped PIN debit',
    fields: {},
  },
  {
    id: 'rv-3-contactless-msd',
    name: 'RV-3 Reversal Contactless MSD ($1.00)',
    description: 'Full reversal for contactless MSD credit',
    fields: {},
  },
  {
    id: 'rv-4-emv',
    name: 'RV-4 Reversal EMV ($1.00)',
    description: 'Full reversal for EMV insert',
    fields: {},
  },
  {
    id: 'rv-5-keyed',
    name: 'RV-5 Reversal Keyed ($1.00)',
    description: 'Full reversal for keyed credit',
    fields: {},
  },
  {
    id: 'rv-6-direct-express',
    name: 'RV-6 Direct Express Reversal',
    description: 'Reversal via Direct Express with same LaneNumber',
    fields: {},
  },
];

// ---------------------------------------------------------------------------
// Credit (standalone refund) templates (RF-1..RF-5)
// ---------------------------------------------------------------------------
export const creditTemplates: TestCaseTemplate[] = [
  {
    id: 'rf-1-swipe-credit',
    name: 'RF-1 Refund Swiped Credit ($1.12)',
    description: 'Standalone refund (swiped credit)',
    fields: { transactionAmount: '1.12' },
  },
  {
    id: 'rf-2-swipe-debit',
    name: 'RF-2 Refund Swiped Debit ($31.00)',
    description: 'Standalone refund (swiped PIN debit)',
    fields: { transactionAmount: '31.00' },
  },
  {
    id: 'rf-3-contactless',
    name: 'RF-3 Refund Contactless ($2.31)',
    description: 'Standalone refund (contactless EMV)',
    fields: { transactionAmount: '2.31' },
  },
  {
    id: 'rf-4-emv',
    name: 'RF-4 Refund EMV ($2.32)',
    description: 'Standalone refund (EMV insert)',
    fields: { transactionAmount: '2.32' },
  },
  {
    id: 'rf-5-keyed',
    name: 'RF-5 Refund Keyed ($1.13)',
    description: 'Standalone refund (manual entry)',
    fields: { transactionAmount: '1.13', invokeManualEntry: true },
  },
];

// ---------------------------------------------------------------------------
// Force (voice-authorized) templates (F-1..F-3)
// ---------------------------------------------------------------------------
export const forceTemplates: TestCaseTemplate[] = [
  {
    id: 'f-1-swipe',
    name: 'F-1 Force Swipe ($3.10)',
    description: 'Forced swipe credit with approval code',
    fields: { transactionAmount: '3.10', approvalCode: '123456' },
  },
  {
    id: 'f-2-contactless',
    name: 'F-2 Force Contactless ($2.31)',
    description: 'Forced contactless credit with approval code',
    fields: { transactionAmount: '2.31', approvalCode: '123456' },
  },
  {
    id: 'f-3-keyed',
    name: 'F-3 Force Keyed ($3.13)',
    description: 'Forced keyed credit with approval code',
    fields: { transactionAmount: '3.13', approvalCode: '123456', invokeManualEntry: true },
  },
];

// ---------------------------------------------------------------------------
// BIN Query templates (BQ-1..BQ-3)
// ---------------------------------------------------------------------------
export const binQueryTemplates: TestCaseTemplate[] = [
  {
    id: 'bq-1-swipe',
    name: 'BQ-1 BIN Query Swipe',
    description: 'Swiped card BIN lookup',
    fields: {},
  },
  {
    id: 'bq-2-contactless',
    name: 'BQ-2 BIN Query Contactless',
    description: 'Contactless card BIN lookup',
    fields: {},
  },
  {
    id: 'bq-3-keyed',
    name: 'BQ-3 BIN Query Keyed',
    description: 'Keyed card BIN lookup',
    fields: {},
  },
];

// ---------------------------------------------------------------------------
// Optional utility/status templates
// ---------------------------------------------------------------------------
export const displayTemplates: TestCaseTemplate[] = [
  {
    id: 'display-ready',
    name: 'Display – Ready',
    description: 'Show a ready prompt on the lane display',
    fields: { text: 'Ready for next transaction' },
  },
  {
    id: 'display-remove-card',
    name: 'Display – Remove Card',
    description: 'Show a card removal instruction',
    fields: { text: 'Please remove card' },
  },
];

export const idleTemplates: TestCaseTemplate[] = [
  {
    id: 'idle-default',
    name: 'Idle – Default',
    description: 'Return the lane to idle mode',
    fields: {},
  },
];

export const inputTemplates: TestCaseTemplate[] = [
  {
    id: 'input-check',
    name: 'Input – Check Status',
    description: 'Poll lane input status',
    fields: {},
  },
];

export const selectionTemplates: TestCaseTemplate[] = [
  {
    id: 'selection-check',
    name: 'Selection – Check Status',
    description: 'Poll lane selection status',
    fields: {},
  },
];

export const signatureTemplates: TestCaseTemplate[] = [
  {
    id: 'signature-check',
    name: 'Signature – Check Status',
    description: 'Poll signature capture status',
    fields: {},
  },
];

export const hostStatusTemplates: TestCaseTemplate[] = [
  {
    id: 'host-status-check',
    name: 'Host Status – Check',
    description: 'Check processor host connectivity',
    fields: {},
  },
];

export const triPosStatusTemplates: TestCaseTemplate[] = [
  {
    id: 'tripos-status-ping',
    name: 'triPOS Status – Ping',
    description: 'Echo test against triPOS status endpoint',
    fields: { echo: 'ping' },
  },
];

export const laneConnectionStatusTemplates: TestCaseTemplate[] = [
  {
    id: 'lane-connection-check',
    name: 'Lane Connection – Check',
    description: 'Check cloud lane connection state',
    fields: {},
  },
];

// ---------------------------------------------------------------------------
// All templates map keyed by endpoint slug
// ---------------------------------------------------------------------------
export const allTemplates: Record<string, TestCaseTemplate[]> = {
  sale: saleTemplates,
  authorization: authorizationTemplates,
  completion: completionTemplates,
  void: voidTemplates,
  return: returnTemplates,
  refund: refundTemplates,
  reversal: reversalTemplates,
  credit: creditTemplates,
  force: forceTemplates,
  binQuery: binQueryTemplates,
  display: displayTemplates,
  idle: idleTemplates,
  input: inputTemplates,
  selection: selectionTemplates,
  signature: signatureTemplates,
  hostStatus: hostStatusTemplates,
  triPosStatus: triPosStatusTemplates,
  laneConnectionStatus: laneConnectionStatusTemplates,
};
