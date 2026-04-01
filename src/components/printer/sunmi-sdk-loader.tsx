'use client';

import { useEffect, useState } from 'react';

export function SunmiSdkLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (typeof window.sunmi !== 'undefined') {
      setLoaded(true);
      return;
    }

    // Check if we're on a Sunmi device
    const isSunmi = /sunmi/i.test(navigator.userAgent);
    if (!isSunmi) {
      console.log('[SunmiSDK] Not on Sunmi device, skipping SDK load');
      return;
    }

    // Load Sunmi SDK
    const script = document.createElement('script');
    script.src = 'https://developer.sunmi.com/h5sdk/printer.js';
    script.async = true;
    script.onload = () => {
      console.log('[SunmiSDK] Loaded');
      setLoaded(true);
    };
    script.onerror = () => {
      console.warn('[SunmiSDK] Failed to load');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount to avoid issues
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
