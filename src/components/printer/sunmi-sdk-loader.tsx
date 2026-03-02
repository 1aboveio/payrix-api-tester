'use client';

import { useEffect, useState } from 'react';

/**
 * Sunmi SDK Loader Component
 * Dynamically loads the Sunmi JS SDK when running on Sunmi devices
 */

// Extend Window interface for Sunmi SDK
declare global {
  interface Window {
    sunmi?: {
      printer?: {
        initLine: (options: { align?: string; fontSize?: number }) => void;
        printText: (text: string, options?: { align?: string; fontSize?: number; bold?: boolean }) => void;
        printTexts: (items: Array<{ text: string; style?: { align?: string; bold?: boolean } }>) => void;
        printDividingLine: () => void;
        printQrCode: (content: string, size?: number) => void;
        autoOut: () => void;
        getStatus: () => Promise<string>;
        getInfo: () => Promise<{ name?: string; model?: string; serial?: string }>;
      };
    };
  }
}

export function SunmiSdkLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.sunmi?.printer) {
      setLoaded(true);
      return;
    }

    // Detect Sunmi device by user agent
    const isSunmiDevice = /sunmi/i.test(navigator.userAgent);

    if (!isSunmiDevice) {
      console.log('[SunmiSdkLoader] Not a Sunmi device, skipping SDK load');
      return;
    }

    // Load Sunmi SDK script
    const script = document.createElement('script');
    script.src = 'https://developer.sunmi.com/h5sdk/printer.js';
    script.async = true;
    script.onload = () => {
      console.log('[SunmiSdkLoader] SDK loaded successfully');
      setLoaded(true);
    };
    script.onerror = () => {
      console.error('[SunmiSdkLoader] Failed to load SDK');
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup not needed for dynamically added scripts
    };
  }, []);

  // This is a headless component - no UI
  return null;
}

/** Hook to check Sunmi printer availability */
export function useSunmiPrinter() {
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPrinter = async () => {
      if (!window.sunmi?.printer) {
        setAvailable(false);
        return;
      }

      try {
        const printerStatus = await window.sunmi.printer.getStatus();
        setStatus(printerStatus);
        setAvailable(printerStatus === 'OK' || printerStatus === 'ready');
      } catch (error) {
        console.error('[useSunmiPrinter] Error checking status:', error);
        setAvailable(false);
      }
    };

    // Check immediately and then poll every 5 seconds
    checkPrinter();
    const interval = setInterval(checkPrinter, 5000);

    return () => clearInterval(interval);
  }, []);

  return { available, status };
}
