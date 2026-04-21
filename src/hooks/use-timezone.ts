'use client';

import { useEffect, useState } from 'react';

import { DEFAULT_TIMEZONE, TIMEZONE_SYNC_TOPIC, getTimezone, saveTimezone } from '@/lib/timezone';

export function useTimezone() {
  const [timezone, setTimezoneState] = useState<string>(DEFAULT_TIMEZONE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Re-hydrate from localStorage on mount — required for SSR safety.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezoneState(getTimezone());
    setHydrated(true);

    const handleSync = () => {
      setTimezoneState(getTimezone());
    };
    window.addEventListener(TIMEZONE_SYNC_TOPIC, handleSync);
    return () => window.removeEventListener(TIMEZONE_SYNC_TOPIC, handleSync);
  }, []);

  const setTimezone = (tz: string) => {
    saveTimezone(tz);
    setTimezoneState(tz);
  };

  return { timezone, setTimezone, hydrated };
}
