'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createTerminalTxnAction } from '@/actions/terminal-txns';
import type {
  CreateTerminalTxnRequest,
  TerminalTxnType,
  TerminalTxnOrigin,
  TerminalTxnBinType,
  TerminalTxnPos,
  TerminalTxnSwiped,
  TerminalTxnPin,
  TerminalTxnSignature,
  TerminalTxnReceipt,
  TerminalTxnInactive,
  TerminalTxnFrozen,
} from '@/lib/payrix/terminal-txns-types';
import {
  TERMINAL_TXN_TYPE_LABELS,
  TERMINAL_TXN_ORIGIN_LABELS,
  TERMINAL_TXN_BIN_TYPE_LABELS,
  TERMINAL_TXN_RECEIPT_LABELS,
} from '@/lib/payrix/terminal-txns-types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

const TXN_TYPES: TerminalTxnType[] = [1, 2, 4, 5, 13];
const ORIGINS: TerminalTxnOrigin[] = [1, 2, 3, 8, 9];
const BIN_TYPES: TerminalTxnBinType[] = ['CREDIT', 'DEBIT', 'PREPAID'];
const RECEIPT_OPTIONS: TerminalTxnReceipt[] = ['noReceipt', 'merchant', 'customer', 'both'];

export default function CreateTerminalTxnPage() {
  const { config } = usePayrixConfig();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  // Required
  const [type, setType] = useState<TerminalTxnType>(1);
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fundingCurrency, setFundingCurrency] = useState('USD');
  const [merchant, setMerchant] = useState('');
  const [mid, setMid] = useState('');
  const [origin, setOrigin] = useState<TerminalTxnOrigin>(1);
  const [pos, setPos] = useState<TerminalTxnPos>(1);
  const [binType, setBinType] = useState<TerminalTxnBinType>('CREDIT');
  const [swiped, setSwiped] = useState<TerminalTxnSwiped>(0);
  const [pin, setPin] = useState<TerminalTxnPin>(0);
  const [signature, setSignature] = useState<TerminalTxnSignature>(1);
  const [reserved, setReserved] = useState(0);
  const [status, setStatus] = useState(1);
  const [inactive, setInactive] = useState<TerminalTxnInactive>(0);
  const [frozen, setFrozen] = useState<TerminalTxnFrozen>(0);

  // Optional
  const [tip, setTip] = useState('');
  const [cashback, setCashback] = useState('');
  const [expiration, setExpiration] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authDate, setAuthDate] = useState('');
  const [traceNumber, setTraceNumber] = useState('');
  const [token, setToken] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [receipt, setReceipt] = useState<TerminalTxnReceipt>('noReceipt');
  const [tid, setTid] = useState('');
  const [txn, setTxn] = useState('');
  const [forterminalTxn, setForterminalTxn] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [posApplicationId, setPosApplicationId] = useState('');
  const [posApplicationName, setPosApplicationName] = useState('');
  const [posApplicationVersion, setPosApplicationVersion] = useState('');
  const [customerReferenceNumber, setCustomerReferenceNumber] = useState('');
  const [gatewayTransactionId, setGatewayTransactionId] = useState('');
  const [customerTicketNumber, setCustomerTicketNumber] = useState('');
  const [cardNetworkTransactionId, setCardNetworkTransactionId] = useState('');
  const [convenienceFee, setConvenienceFee] = useState('');
  const [surcharge, setSurcharge] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config?.platformApiKey) {
      toast.error('Platform API key not configured.');
      return;
    }
    const totalNum = parseInt(total, 10);
    if (isNaN(totalNum) || totalNum < 0) {
      toast.error('Total must be a non-negative integer (in cents).');
      return;
    }

    const requestId = generateRequestId();
    const body: CreateTerminalTxnRequest = {
      type, total: totalNum, currency, fundingCurrency, merchant, mid, origin, pos,
      binType, swiped, pin, signature, reserved, status, inactive, frozen,
      ...(tip && { tip: parseInt(tip, 10) }),
      ...(cashback && { cashback: parseInt(cashback, 10) }),
      ...(expiration && { expiration }),
      ...(authCode && { authCode }),
      ...(authDate && { authDate }),
      ...(traceNumber && { traceNumber: parseInt(traceNumber, 10) }),
      ...(token && { token }),
      ...(paymentNumber && { paymentNumber: parseInt(paymentNumber, 10) }),
      ...(receipt && { receipt }),
      ...(tid && { tid }),
      ...(txn && { txn }),
      ...(forterminalTxn && { forterminalTxn }),
      ...(description && { description }),
      ...(order && { order }),
      ...(company && { company }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address1 && { address1 }),
      ...(address2 && { address2 }),
      ...(city && { city }),
      ...(stateVal && { state: stateVal }),
      ...(zip && { zip }),
      ...(country && { country }),
      ...(first && { first }),
      ...(last && { last }),
      ...(posApplicationId && { posApplicationId }),
      ...(posApplicationName && { posApplicationName }),
      ...(posApplicationVersion && { posApplicationVersion }),
      ...(customerReferenceNumber && { customerReferenceNumber }),
      ...(gatewayTransactionId && { gatewayTransactionId }),
      ...(customerTicketNumber && { customerTicketNumber }),
      ...(cardNetworkTransactionId && { cardNetworkTransactionId }),
      ...(convenienceFee && { convenienceFee: parseInt(convenienceFee, 10) }),
      ...(surcharge && { surcharge: parseInt(surcharge, 10) }),
    };

    setSubmitting(true);
    toast.info('Creating terminal transaction...');
    try {
      const response = await createTerminalTxnAction({ config, requestId }, body);
      setResult(response);
      if (response.apiResponse.error) {
        toast.error('Failed to create terminal transaction.');
      } else {
        toast.success('Terminal transaction created.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/platform/terminal-txns"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Terminal Transaction</h1>
          <p className="text-muted-foreground text-sm">POST /terminalTxns — Payrix Pro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Required */}
        <Card>
          <CardHeader>
            <CardTitle>Required Fields</CardTitle>
            <CardDescription>All fields marked * are required by the API.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={String(type)} onValueChange={(v) => setType(Number(v) as TerminalTxnType)}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TXN_TYPES.map((t) => (
                    <SelectItem key={t} value={String(t)}>{TERMINAL_TXN_TYPE_LABELS[t]} ({t})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Total (cents) *</Label>
              <Input id="total" type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 5000 = $50.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="USD" maxLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fundingCurrency">Funding Currency *</Label>
              <Input id="fundingCurrency" value={fundingCurrency} onChange={(e) => setFundingCurrency(e.target.value.toUpperCase())} placeholder="USD" maxLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant ID *</Label>
              <Input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. m1_xxxxx" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mid">MID *</Label>
              <Input id="mid" value={mid} onChange={(e) => setMid(e.target.value)} placeholder="Merchant ID Number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origin *</Label>
              <Select value={String(origin)} onValueChange={(v) => setOrigin(Number(v) as TerminalTxnOrigin)}>
                <SelectTrigger id="origin"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o} value={String(o)}>{TERMINAL_TXN_ORIGIN_LABELS[o]} ({o})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos">POS *</Label>
              <Select value={String(pos)} onValueChange={(v) => setPos(Number(v) as TerminalTxnPos)}>
                <SelectTrigger id="pos"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Internal (0)</SelectItem>
                  <SelectItem value="1">External (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="binType">BIN Type *</Label>
              <Select value={binType} onValueChange={(v) => setBinType(v as TerminalTxnBinType)}>
                <SelectTrigger id="binType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BIN_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>{TERMINAL_TXN_BIN_TYPE_LABELS[b]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="swiped">Swiped *</Label>
              <Select value={String(swiped)} onValueChange={(v) => setSwiped(Number(v) as TerminalTxnSwiped)}>
                <SelectTrigger id="swiped"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No (0)</SelectItem>
                  <SelectItem value="1">Yes (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN *</Label>
              <Select value={String(pin)} onValueChange={(v) => setPin(Number(v) as TerminalTxnPin)}>
                <SelectTrigger id="pin"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No (0)</SelectItem>
                  <SelectItem value="1">Yes (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature">Signature *</Label>
              <Select value={String(signature)} onValueChange={(v) => setSignature(Number(v) as TerminalTxnSignature)}>
                <SelectTrigger id="signature"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No (0)</SelectItem>
                  <SelectItem value="1">Yes (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserved">Reserved *</Label>
              <Input id="reserved" type="number" min="0" value={reserved} onChange={(e) => setReserved(parseInt(e.target.value, 10) || 0)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Input id="status" type="number" min="0" value={status} onChange={(e) => setStatus(parseInt(e.target.value, 10) || 0)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inactive">Inactive *</Label>
              <Select value={String(inactive)} onValueChange={(v) => setInactive(parseInt(v, 10) as TerminalTxnInactive)}>
                <SelectTrigger id="inactive"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No (0)</SelectItem>
                  <SelectItem value="1">Yes (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frozen">Frozen *</Label>
              <Select value={String(frozen)} onValueChange={(v) => setFrozen(parseInt(v, 10) as TerminalTxnFrozen)}>
                <SelectTrigger id="frozen"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No (0)</SelectItem>
                  <SelectItem value="1">Yes (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Optional — Transaction */}
        <Card>
          <CardHeader><CardTitle>Optional Fields</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="tip">Tip (cents)</Label><Input id="tip" type="number" min="0" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="e.g. 500" /></div>
            <div className="space-y-2"><Label htmlFor="cashback">Cashback (cents)</Label><Input id="cashback" type="number" min="0" value={cashback} onChange={(e) => setCashback(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="expiration">Expiration (MMYY)</Label><Input id="expiration" value={expiration} onChange={(e) => setExpiration(e.target.value.toUpperCase())} placeholder="e.g. 0627" maxLength={4} /></div>
            <div className="space-y-2"><Label htmlFor="authCode">Auth Code</Label><Input id="authCode" value={authCode} onChange={(e) => setAuthCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123" /></div>
            <div className="space-y-2"><Label htmlFor="authDate">Auth Date (YYYYMMDD)</Label><Input id="authDate" value={authDate} onChange={(e) => setAuthDate(e.target.value)} placeholder="e.g. 20250323" maxLength={8} /></div>
            <div className="space-y-2"><Label htmlFor="traceNumber">Trace Number</Label><Input id="traceNumber" type="number" value={traceNumber} onChange={(e) => setTraceNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="token">Token ID</Label><Input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. t1_tok_xxxxx" /></div>
            <div className="space-y-2"><Label htmlFor="paymentNumber">Payment Number (last 4)</Label><Input id="paymentNumber" type="number" value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} maxLength={4} /></div>
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt</Label>
              <Select value={receipt} onValueChange={(v) => setReceipt(v as TerminalTxnReceipt)}>
                <SelectTrigger id="receipt"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECEIPT_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{TERMINAL_TXN_RECEIPT_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="tid">Terminal ID</Label><Input id="tid" value={tid} onChange={(e) => setTid(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="txn">Related Txn ID</Label><Input id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="e.g. t1_txn_xxxxx" /></div>
            <div className="space-y-2"><Label htmlFor="forterminalTxn">For Terminal Txn (refund)</Label><Input id="forterminalTxn" value={forterminalTxn} onChange={(e) => setForterminalTxn(e.target.value)} placeholder="Original terminal txn ID" /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Description</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} /></div>
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader><CardTitle>Customer &amp; Location</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="first">First Name</Label><Input id="first" value={first} onChange={(e) => setFirst(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="last">Last Name</Label><Input id="last" value={last} onChange={(e) => setLast(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="company">Company</Label><Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="order">Order ID</Label><Input id="order" value={order} onChange={(e) => setOrder(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="address1">Address 1</Label><Input id="address1" value={address1} onChange={(e) => setAddress1(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="address2">Address 2</Label><Input id="address2" value={address2} onChange={(e) => setAddress2(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" value={stateVal} onChange={(e) => setStateVal(e.target.value)} maxLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="zip">ZIP</Label><Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="country">Country</Label><Input id="country" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="US" maxLength={2} /></div>
          </CardContent>
        </Card>

        {/* POS & Express */}
        <Card>
          <CardHeader><CardTitle>POS &amp; Express Fields</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="posApplicationId">POS Application ID</Label><Input id="posApplicationId" value={posApplicationId} onChange={(e) => setPosApplicationId(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="posApplicationName">POS Application Name</Label><Input id="posApplicationName" value={posApplicationName} onChange={(e) => setPosApplicationName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="posApplicationVersion">POS Application Version</Label><Input id="posApplicationVersion" value={posApplicationVersion} onChange={(e) => setPosApplicationVersion(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="customerReferenceNumber">Customer Reference Number</Label><Input id="customerReferenceNumber" value={customerReferenceNumber} onChange={(e) => setCustomerReferenceNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="gatewayTransactionId">Gateway Transaction ID</Label><Input id="gatewayTransactionId" value={gatewayTransactionId} onChange={(e) => setGatewayTransactionId(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="customerTicketNumber">Customer Ticket Number</Label><Input id="customerTicketNumber" value={customerTicketNumber} onChange={(e) => setCustomerTicketNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="cardNetworkTransactionId">Card Network Transaction ID</Label><Input id="cardNetworkTransactionId" value={cardNetworkTransactionId} onChange={(e) => setCardNetworkTransactionId(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="convenienceFee">Convenience Fee (cents)</Label><Input id="convenienceFee" type="number" min="0" value={convenienceFee} onChange={(e) => setConvenienceFee(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="surcharge">Surcharge (cents)</Label><Input id="surcharge" type="number" min="0" value={surcharge} onChange={(e) => setSurcharge(e.target.value)} /></div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting || !config?.platformApiKey}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><CreditCard className="mr-2 h-4 w-4" />Create Terminal Transaction</>}
          </Button>
          <Button variant="outline" asChild><Link href="/platform/terminal-txns">Cancel</Link></Button>
        </div>
      </form>

      {result && (
        <PlatformApiResultPanel
          config={config}
          endpoint="/terminalTxns"
          method="POST"
          requestPreview={{}}
          result={result}
          loading={submitting}
        />
      )}
    </div>
  );
}
