'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimezone } from '@/hooks/use-timezone';
import { TIMEZONES } from '@/lib/timezone';

export function TimezoneSelect() {
  const { timezone, setTimezone, hydrated } = useTimezone();
  return (
    <Select value={hydrated ? timezone : undefined} onValueChange={setTimezone}>
      <SelectTrigger aria-label="Timezone" className="w-[180px] h-9">
        <SelectValue placeholder="Timezone" />
      </SelectTrigger>
      <SelectContent>
        {TIMEZONES.map((tz) => (
          <SelectItem key={tz.value} value={tz.value}>
            {tz.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
