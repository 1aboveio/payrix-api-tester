'use client';

import { Printer, PrinterCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/lib/toast';
import { getPrinterService, type PrinterReceiptData } from '@/lib/printer';

interface PrintButtonProps {
  data: PrinterReceiptData | null;
  disabled?: boolean;
}

export function PrintButton({ data, disabled }: PrintButtonProps) {
  const [printerAvailable, setPrinterAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPrinter = async () => {
      const service = getPrinterService();
      const { available } = await service.getStatus();
      setPrinterAvailable(available);
      setChecking(false);
    };

    checkPrinter();
    // Recheck every 10 seconds
    const interval = setInterval(checkPrinter, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = async () => {
    if (!data) {
      toast.error('No receipt data available');
      return;
    }

    const service = getPrinterService();
    try {
      await service.printReceipt(data);
      toast.success('Receipt printed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print failed';
      toast.error(`Print failed: ${message}`);
    }
  };

  if (checking) {
    return (
      <Button variant="secondary" disabled>
        <Printer className="mr-2 h-4 w-4" />
        Checking printer...
      </Button>
    );
  }

  if (!printerAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" disabled={disabled}>
              <Printer className="mr-2 h-4 w-4 opacity-50" />
              No Printer
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sunmi printer not detected</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={handlePrint}
      disabled={disabled || !data}
    >
      <PrinterCheck className="mr-2 h-4 w-4" />
      Print Receipt
    </Button>
  );
}
