'use client';

import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Ban,
  Bell,
  BookCheck,
  Building2,
  CreditCard,
  FileCheck,
  FileText,
  History,
  Landmark,
  List,
  Receipt,
  Printer,
  Search,
  Settings,
  Shield,
  Users,
  Wallet,
  Webhook,
  XCircle,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { PlatformModule } from '@/lib/platform/types';

interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// TriPOS Cloud navigation (existing)
const triposNavSections: NavSection[] = [
  {
    label: 'Lanes',
    items: [
      { title: 'Create Lane', href: '/lanes/create', icon: Landmark },
      { title: 'List Lanes', href: '/lanes', icon: BookCheck },
      { title: 'Connection Status', href: '/lanes/connection-status', icon: Search },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { title: 'Sale', href: '/transactions/sale', icon: CreditCard },
      { title: 'Authorization', href: '/transactions/authorization', icon: Shield },
      { title: 'Completion', href: '/transactions/completion', icon: FileCheck },
      { title: 'Force', href: '/transactions/force', icon: Zap },
      { title: 'Transaction Query', href: '/transactions/query', icon: Wallet },
      { title: 'Transaction List', href: '/transactions', icon: List },
    ],
  },
  {
    label: 'Reversals',
    items: [
      { title: 'Void', href: '/reversals/void', icon: XCircle },
      { title: 'Return', href: '/reversals/return', icon: CreditCard },
      { title: 'Refund', href: '/transactions/refund', icon: Wallet },
      { title: 'Reversal', href: '/reversals/reversal', icon: XCircle },
      { title: 'Credit', href: '/reversals/credit', icon: Wallet },
      { title: 'Cancel', href: '/reversals/cancel', icon: Ban },
    ],
  },
  {
    label: 'Utility',
    items: [
      { title: 'BIN Query', href: '/transactions/bin-query', icon: Search },
      { title: 'Receipt', href: '/receipt', icon: Receipt },
      { title: 'Display', href: '/utility/display', icon: CreditCard },
      { title: 'Idle', href: '/utility/idle', icon: XCircle },
      { title: 'Input Status', href: '/utility/input', icon: List },
      { title: 'Selection Status', href: '/utility/selection', icon: BookCheck },
      { title: 'Signature Status', href: '/utility/signature', icon: FileCheck },
      { title: 'Host Status', href: '/utility/status/host', icon: Shield },
      { title: 'triPOS Status', href: '/utility/status/tripos', icon: Zap },
    ],
  },
];

// Payrix Platform navigation (new)
const platformNavSections: NavSection[] = [
  {
    label: 'Invoices',
    items: [
      { title: 'Invoice List', href: '/platform/invoices', icon: FileText },
      { title: 'Create Invoice', href: '/platform/invoices/create', icon: FileCheck },
    ],
  },
  {
    label: 'Utilities',
    items: [
      { title: 'Printer', href: '/platform/printer', icon: Printer },
    ],
  },
  {
    label: 'Merchants',
    items: [
      { title: 'Merchant List', href: '/platform/merchants', icon: Building2 },
    ],
  },
  {
    label: 'Customers',
    items: [
      { title: 'Customer List', href: '/platform/customers', icon: Users },
      { title: 'Create Customer', href: '/platform/customers/create', icon: FileCheck },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { title: 'Transaction List', href: '/platform/transactions', icon: CreditCard },
      { title: 'Terminal Transactions', href: '/platform/terminal-txns', icon: CreditCard },
    ],
  },
  {
    label: 'Webhooks',
    items: [
      { title: 'Alerts', href: '/platform/alerts', icon: Bell },
      { title: 'Webhook Monitor', href: '/webhooks', icon: Webhook },
    ],
  },
];

function getActiveModule(pathname: string): PlatformModule {
  return pathname.startsWith('/platform') ? 'platform' : 'tripos';
}

function ModuleSwitcher({ 
  activeModule, 
  onModuleChange 
}: { 
  activeModule: PlatformModule;
  onModuleChange: (module: PlatformModule) => void;
}) {
  return (
    <div className="px-2 py-3">
      <Select value={activeModule} onValueChange={(value) => onModuleChange(value as PlatformModule)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select module" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tripos">TriPOS Cloud</SelectItem>
          <SelectItem value="platform">Payrix Platform</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function NavSectionComponent({ section, pathname }: { section: NavSection; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
      <SidebarMenu>
        {section.items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={active}>
                <Link href={item.href}>
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { config, hydrated, setGlobalEnvironment } = usePayrixConfig();
  const activeModule = getActiveModule(pathname);

  const handleModuleChange = (module: PlatformModule) => {
    // Navigate to the root route of the selected module
    if (module === 'tripos') {
      window.location.href = '/transactions/sale';
    } else {
      window.location.href = '/platform/invoices';
    }
  };

  const navSections = activeModule === 'platform' ? platformNavSections : triposNavSections;
  const isProd = config.globalEnvironment === 'live';
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader
          className={`border-b px-2 py-3 text-sm font-semibold ${
            config.globalEnvironment === 'test' && hydrated ? 'border-l-4 border-orange-400' : ''
          }`}
        >
          Payrix API Tester
        </SidebarHeader>
        <SidebarContent>
          <ModuleSwitcher activeModule={activeModule} onModuleChange={handleModuleChange} />
          
          {navSections.map((section) => (
            <NavSectionComponent key={section.label} section={section} pathname={pathname} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/history'}>
                <Link href="/history">
                  <History className="size-4" />
                  <span>History</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/settings'}>
                <Link href="/settings">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset data-env={config.globalEnvironment}>
        <header
          className={`sticky top-0 z-10 border-b px-4 py-3 ${
            config.globalEnvironment === 'test'
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/40'
              : 'border-border bg-background'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-base font-semibold">Payrix API Tester</h1>
              {hydrated && (
                <div className="flex rounded-md border border-input bg-background">
                  <button
                    type="button"
                    onClick={() => setGlobalEnvironment('test')}
                    className={`rounded-l-md px-3 py-1 text-xs font-medium transition-colors ${
                      config.globalEnvironment === 'test'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    TEST
                  </button>
                  <AlertDialog open={showLiveConfirm} onOpenChange={setShowLiveConfirm}>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className={`rounded-r-md border-l px-3 py-1 text-xs font-medium transition-colors ${
                          config.globalEnvironment === 'live'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        LIVE
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="text-orange-500" />
                          Switch to Live Environment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          TriPOS and Payrix Platform will make real API calls. Real transactions will be processed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setGlobalEnvironment('live');
                            setShowLiveConfirm(false);
                          }}
                        >
                          Switch to Live
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/history">History</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">Settings</Link>
              </Button>
            </div>
          </div>
          {hydrated && isProd && (
            <div className="mt-3 rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Production environment is active. {activeModule === 'platform' ? 'Platform APIs' : 'Transactions'} execute against live endpoints.
            </div>
          )}
        </header>
        <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
