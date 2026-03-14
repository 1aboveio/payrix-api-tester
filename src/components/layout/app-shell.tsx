'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  const { config, hydrated } = usePayrixConfig();
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
  const isProd = activeModule === 'tripos' 
    ? config.environment === 'prod' 
    : config.platformEnvironment === 'prod';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <div className="px-2 pt-4 text-sm font-semibold">Payrix API Tester</div>
          
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

      <SidebarInset>
        <header className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-base font-semibold">Payrix API Tester</h1>
              {hydrated && (
                <Badge variant={isProd ? 'destructive' : 'secondary'}>
                  {activeModule === 'platform' ? config.platformEnvironment : config.environment}
                </Badge>
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
