'use client';

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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sidebar,
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
import type { GlobalEnvironment } from '@/lib/payrix/types';
import type { PlatformModule } from '@/lib/platform/types';
import type { ComponentType } from 'react';

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
  onModuleChange,
}: {
  activeModule: PlatformModule;
  onModuleChange: (module: PlatformModule) => void;
}) {
  return (
    <div className="px-2 py-3">
      <Select
        value={activeModule}
        onValueChange={(value) => onModuleChange(value as PlatformModule)}
      >
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

function NavSectionComponent({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
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

export function AppShell({ children }: { children: import('react').ReactNode }) {
  const pathname = usePathname();
  const { config, hydrated, setGlobalEnvironment } = usePayrixConfig();
  const activeModule = getActiveModule(pathname);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);

  const handleModuleChange = (module: PlatformModule) => {
    if (module === 'tripos') {
      window.location.href = '/transactions/sale';
    } else {
      window.location.href = '/platform/invoices';
    }
  };

  const navSections =
    activeModule === 'platform' ? platformNavSections : triposNavSections;

  const isLive = config.globalEnvironment === 'live';

  const headerClasses = isLive
    ? 'border-b border-border bg-background'
    : 'border-b border-orange-400 bg-orange-50 dark:bg-orange-950/40';

  const handleEnvToggle = (env: GlobalEnvironment) => {
    if (env === 'live') {
      setShowLiveConfirm(true);
    } else {
      setGlobalEnvironment('test');
    }
  };

  return (
    <SidebarProvider>
      <Sidebar
        data-env={config.globalEnvironment}
        className={isLive ? '' : 'border-r-4 border-orange-400'}
      >
        <SidebarHeader
          className={isLive ? '' : 'border-b border-orange-400'}
        >
          <div className="px-2 pt-4 text-sm font-semibold">
            Payrix API Tester
          </div>
        </SidebarHeader>

        <SidebarContent>
          <ModuleSwitcher
            activeModule={activeModule}
            onModuleChange={handleModuleChange}
          />

          {navSections.map((section) => (
            <NavSectionComponent
              key={section.label}
              section={section}
              pathname={pathname}
            />
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

      <SidebarInset>
        <header className={`border-b px-4 py-3 ${headerClasses}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-base font-semibold">Payrix API Tester</h1>
              {hydrated && (
                <Badge
                  variant={isLive ? 'destructive' : 'secondary'}
                  className={
                    !isLive
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      : undefined
                  }
                >
                  {isLive ? 'LIVE' : 'TEST'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Global environment toggle */}
              {hydrated && (
                <div className="flex rounded-md border border-input bg-background p-0.5 text-xs font-medium">
                  <button
                    onClick={() => handleEnvToggle('test')}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      config.globalEnvironment === 'test'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    TEST
                  </button>
                  <button
                    onClick={() => handleEnvToggle('live')}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      config.globalEnvironment === 'live'
                        ? 'bg-destructive text-white'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    LIVE
                  </button>
                </div>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href="/history">History</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">Settings</Link>
              </Button>
            </div>
          </div>
          {hydrated && isLive && (
            <div className="mt-3 rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Production environment is active. Real API calls will be made.
            </div>
          )}
        </header>
        <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
      </SidebarInset>

      {/* Confirmation dialog: switching to LIVE */}
      <AlertDialog open={showLiveConfirm} onOpenChange={setShowLiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Switch to Live Environment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              TriPOS and Payrix Platform will make real API calls. Real
              transactions will be processed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLiveConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setGlobalEnvironment('live');
                setShowLiveConfirm(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Switch to Live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
