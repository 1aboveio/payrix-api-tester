const TIMEZONE_KEY = 'payrix_timezone';
const TIMEZONE_SYNC_EVENT = 'payrix-timezone-sync';

export const TIMEZONE_SYNC_TOPIC = TIMEZONE_SYNC_EVENT;

export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Shanghai', label: 'UTC+8 (Shanghai)' },
];

export const DEFAULT_TIMEZONE = 'America/New_York';
export const PAYRIX_SOURCE_TIMEZONE = 'America/New_York';

export function dispatchTimezoneSync(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TIMEZONE_SYNC_EVENT));
  }
}

export function getTimezone(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TIMEZONE;
  }
  try {
    const stored = localStorage.getItem(TIMEZONE_KEY);
    if (stored && TIMEZONES.some((tz) => tz.value === stored)) {
      return stored;
    }
  } catch (error) {
    console.error('Error reading timezone from localStorage:', error);
  }
  return DEFAULT_TIMEZONE;
}

export function saveTimezone(tz: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(TIMEZONE_KEY, tz);
    dispatchTimezoneSync();
  } catch (error) {
    console.error('Error saving timezone to localStorage:', error);
  }
}
