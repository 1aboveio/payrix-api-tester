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
// Sale templates
// ---------------------------------------------------------------------------
export const saleTemplates: TestCaseTemplate[] = [
  {
    id: 'sale-approved',
    name: 'Sale – Approved',
    description: 'Basic sale that should approve ($5.00)',
    fields: { transactionAmount: '5.00', referenceNumber: 'CERT-SALE-01' },
  },
  {
    id: 'sale-decline',
    name: 'Sale – Decline',
    description: 'Sale expected to decline ($0.01)',
    fields: { transactionAmount: '0.01', referenceNumber: 'CERT-SALE-02' },
  },
  {
    id: 'sale-partial-approval',
    name: 'Sale – Partial Approval',
    description: 'Sale for partial approval ($23.05)',
    fields: { transactionAmount: '23.05', referenceNumber: 'CERT-SALE-03' },
  },
  {
    id: 'sale-avs-test',
    name: 'Sale – AVS Test',
    description: 'Sale amount for AVS verification ($10.00)',
    fields: { transactionAmount: '10.00', referenceNumber: 'CERT-SALE-AVS' },
  },
  {
    id: 'sale-cvv-test',
    name: 'Sale – CVV Test',
    description: 'Sale amount for CVV verification ($15.00)',
    fields: { transactionAmount: '15.00', referenceNumber: 'CERT-SALE-CVV' },
  },
  {
    id: 'sale-void-follow',
    name: 'Sale – Then Void',
    description: 'Sale to be followed by a Void ($7.50)',
    fields: { transactionAmount: '7.50', referenceNumber: 'CERT-SALE-VOID' },
  },
  {
    id: 'sale-return-follow',
    name: 'Sale – Then Return',
    description: 'Sale to be followed by a Return ($12.00)',
    fields: { transactionAmount: '12.00', referenceNumber: 'CERT-SALE-RETURN' },
  },
];

// ---------------------------------------------------------------------------
// Authorization templates
// ---------------------------------------------------------------------------
export const authorizationTemplates: TestCaseTemplate[] = [
  {
    id: 'auth-approved',
    name: 'Auth – Approved',
    description: 'Basic authorization that should approve ($10.00)',
    fields: { transactionAmount: '10.00', referenceNumber: 'CERT-AUTH-01' },
  },
  {
    id: 'auth-decline',
    name: 'Auth – Decline',
    description: 'Authorization expected to decline ($0.01)',
    fields: { transactionAmount: '0.01', referenceNumber: 'CERT-AUTH-02' },
  },
  {
    id: 'auth-partial-approval',
    name: 'Auth – Partial Approval',
    description: 'Authorization for partial approval ($23.05)',
    fields: { transactionAmount: '23.05', referenceNumber: 'CERT-AUTH-03' },
  },
  {
    id: 'auth-completion-follow',
    name: 'Auth – Then Completion',
    description: 'Authorization to be followed by Completion ($25.00)',
    fields: { transactionAmount: '25.00', referenceNumber: 'CERT-AUTH-COMP' },
  },
  {
    id: 'auth-reversal-follow',
    name: 'Auth – Then Reversal',
    description: 'Authorization to be followed by Reversal ($18.00)',
    fields: { transactionAmount: '18.00', referenceNumber: 'CERT-AUTH-REV' },
  },
];

// ---------------------------------------------------------------------------
// Completion templates
// ---------------------------------------------------------------------------
export const completionTemplates: TestCaseTemplate[] = [
  {
    id: 'completion-full',
    name: 'Completion – Full Amount',
    description: 'Complete authorization for full amount',
    fields: { referenceNumber: 'CERT-COMP-01' },
  },
  {
    id: 'completion-partial',
    name: 'Completion – Partial Amount',
    description: 'Complete authorization for a lesser amount ($15.00)',
    fields: { transactionAmount: '15.00', referenceNumber: 'CERT-COMP-02' },
  },
  {
    id: 'completion-with-tip',
    name: 'Completion – With Tip',
    description: 'Complete with a tip-adjusted amount ($28.00)',
    fields: { transactionAmount: '28.00', referenceNumber: 'CERT-COMP-TIP' },
  },
];

// ---------------------------------------------------------------------------
// Void templates
// ---------------------------------------------------------------------------
export const voidTemplates: TestCaseTemplate[] = [
  {
    id: 'void-sale',
    name: 'Void – Sale',
    description: 'Void a previously approved sale',
    fields: { referenceNumber: 'CERT-VOID-01' },
  },
  {
    id: 'void-auth',
    name: 'Void – Authorization',
    description: 'Void a previously approved authorization',
    fields: { referenceNumber: 'CERT-VOID-AUTH' },
  },
];

// ---------------------------------------------------------------------------
// Return templates
// ---------------------------------------------------------------------------
export const returnTemplates: TestCaseTemplate[] = [
  {
    id: 'return-full',
    name: 'Return – Full Amount',
    description: 'Return the full sale amount',
    fields: { referenceNumber: 'CERT-RETURN-01' },
  },
  {
    id: 'return-partial',
    name: 'Return – Partial Amount',
    description: 'Return a partial amount ($5.00)',
    fields: { amount: '5.00', referenceNumber: 'CERT-RETURN-02' },
  },
];

// ---------------------------------------------------------------------------
// Refund templates
// ---------------------------------------------------------------------------
export const refundTemplates: TestCaseTemplate[] = [
  {
    id: 'refund-full',
    name: 'Refund – Full Amount',
    description: 'Linked refund for the full sale amount',
    fields: { referenceNumber: 'CERT-REFUND-01' },
  },
  {
    id: 'refund-partial',
    name: 'Refund – Partial Amount',
    description: 'Linked refund for a partial amount ($6.00)',
    fields: { transactionAmount: '6.00', referenceNumber: 'CERT-REFUND-02' },
  },
];

// ---------------------------------------------------------------------------
// Reversal templates
// ---------------------------------------------------------------------------
export const reversalTemplates: TestCaseTemplate[] = [
  {
    id: 'reversal-timeout',
    name: 'Reversal – Timeout',
    description: 'Reversal after a timeout scenario',
    fields: { referenceNumber: 'CERT-REV-01' },
  },
  {
    id: 'reversal-auth',
    name: 'Reversal – Authorization',
    description: 'Reverse a prior authorization',
    fields: { referenceNumber: 'CERT-REV-AUTH' },
  },
];

// ---------------------------------------------------------------------------
// Credit (standalone refund) templates
// ---------------------------------------------------------------------------
export const creditTemplates: TestCaseTemplate[] = [
  {
    id: 'credit-approved',
    name: 'Credit – Approved',
    description: 'Standalone credit/refund ($10.00)',
    fields: { transactionAmount: '10.00', referenceNumber: 'CERT-CREDIT-01' },
  },
  {
    id: 'credit-small',
    name: 'Credit – Small Amount',
    description: 'Standalone credit for a small amount ($1.50)',
    fields: { transactionAmount: '1.50', referenceNumber: 'CERT-CREDIT-02' },
  },
];

// ---------------------------------------------------------------------------
// Force (voice-authorized) templates
// ---------------------------------------------------------------------------
export const forceTemplates: TestCaseTemplate[] = [
  {
    id: 'force-approved',
    name: 'Force – Voice Auth',
    description: 'Force transaction with voice approval code ($20.00)',
    fields: { transactionAmount: '20.00', approvalCode: '123456', referenceNumber: 'CERT-FORCE-01' },
  },
];

// ---------------------------------------------------------------------------
// BIN Query templates
// ---------------------------------------------------------------------------
export const binQueryTemplates: TestCaseTemplate[] = [
  {
    id: 'binquery-lookup',
    name: 'BIN Query – Card Lookup',
    description: 'Query BIN information for inserted/swiped card',
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
    fields: { displayText: 'Ready for next transaction' },
  },
  {
    id: 'display-remove-card',
    name: 'Display – Remove Card',
    description: 'Show a card removal instruction',
    fields: { displayText: 'Please remove card' },
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
