'use client';

import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { getPrinterService, formatReceipt, ReceiptData } from '@/lib/printer';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PrintReceiptButtonProps {
  receiptData: ReceiptData;
  merchantName?: string;
  disabled?: boolean;
}

export function PrintReceiptButton({
  receiptData,
  merchantName,
  disabled,
}: PrintReceiptButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    setIsPrinting(true);
    setError(null);

    try {
      const printer = getPrinterService();
      const status = await printer.getStatus();

      if (!status.available) {
        throw new Error(`Printer not available: ${status.status}`);
      }

      await printer.printReceipt({
        ...receiptData,
        merchantName: merchantName ?? receiptData.merchantName,
      });
    } catch (err) {
      console.error('Print error:', err);
      setError(err instanceof Error ? err.message : 'Print failed');
    } finally {
      setIsPrinting(false);
    }
  };

  const printer = getPrinterService();
  const isSunmi = printer.constructor.name === 'SunmiPrinter';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={disabled || isPrinting}
              className="gap-2"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  {isSunmi ? 'Print (Sunmi)' : 'Print Receipt'}
                </>
              )}
            </Button>
            {error && (
              <span className="text-xs text-red-500 ml-2">{error}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isSunmi ? 'Print via Sunmi thermal printer' : 'Print via browser'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
