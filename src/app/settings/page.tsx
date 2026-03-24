'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { toast } from '@/lib/toast';
import type { PayrixConfig } from '@/lib/payrix/types';
import { TriposTab } from './tabs/tripos-tab';
import { PlatformTab } from './tabs/platform-tab';
import { PrinterTab } from './tabs/printer-tab';

const VALID_TABS = ['tripos', 'platform', 'printer'] as const;
type TabValue = (typeof VALID_TABS)[number];

function SettingsInner() {
  const { config, hydrated, updateConfig, reset } = usePayrixConfig();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [savedTripos, setSavedTripos] = useState(false);
  const [wasResetTripos, setWasResetTripos] = useState(false);
  const [savedPlatform, setSavedPlatform] = useState(false);
  const [wasResetPlatform, setWasResetPlatform] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState(false);
  const [wasResetPrinter, setWasResetPrinter] = useState(false);

  // Determine active tab from URL param, defaulting to 'tripos'
  const rawTab = searchParams.get('tab')?.toLowerCase();
  const activeTab: TabValue = VALID_TABS.includes(rawTab as TabValue) ? (rawTab as TabValue) : 'tripos';

  const setActiveTab = (tab: TabValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  const handleSave = () => {
    updateConfig(config);
    toast.success('Settings saved');
  };

  const handleReset = () => {
    reset();
    toast.success('Settings reset to defaults');
  };

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
      <TabsList>
        <TabsTrigger value="tripos">triPOS Cloud</TabsTrigger>
        <TabsTrigger value="platform">Payrix Platform</TabsTrigger>
        <TabsTrigger value="printer">Printer</TabsTrigger>
      </TabsList>

      <TabsContent value="tripos">
        <TriposTab
          config={config}
          onFieldChange={(field, value) => { updateConfig({ ...config, [field]: value }); setSavedTripos(false); setWasResetTripos(false); setSavedPlatform(false); setWasResetPlatform(false); setSavedPrinter(false); setWasResetPrinter(false); }}
          onSave={() => { handleSave(); setSavedTripos(true); setWasResetTripos(false); }}
          onReset={() => { handleReset(); setSavedTripos(false); setWasResetTripos(true); }}
          saved={savedTripos}
          wasReset={wasResetTripos}
        />
      </TabsContent>

      <TabsContent value="platform">
        <PlatformTab
          config={config}
          onFieldChange={(field, value) => { updateConfig({ ...config, [field]: value }); setSavedTripos(false); setWasResetTripos(false); setSavedPlatform(false); setWasResetPlatform(false); setSavedPrinter(false); setWasResetPrinter(false); }}
          onSave={() => { handleSave(); setSavedPlatform(true); setWasResetPlatform(false); }}
          onReset={() => { handleReset(); setSavedPlatform(false); setWasResetPlatform(true); }}
          saved={savedPlatform}
          wasReset={wasResetPlatform}
        />
      </TabsContent>

      <TabsContent value="printer">
        <PrinterTab
          config={config}
          onFieldChange={(field, value) => { updateConfig({ ...config, [field]: value }); setSavedTripos(false); setWasResetTripos(false); setSavedPlatform(false); setWasResetPlatform(false); setSavedPrinter(false); setWasResetPrinter(false); }}
          onSave={() => { handleSave(); setSavedPrinter(true); setWasResetPrinter(false); }}
          onReset={() => { handleReset(); setSavedPrinter(false); setWasResetPrinter(true); }}
          saved={savedPrinter}
          wasReset={wasResetPrinter}
        />
      </TabsContent>
    </Tabs>
  );
}

function SettingsLoading() {
  return <div className="text-sm text-muted-foreground">Loading settings...</div>;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsInner />
    </Suspense>
  );
}
