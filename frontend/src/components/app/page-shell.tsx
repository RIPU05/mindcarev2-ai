"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Menu,
  Moon,
  Search,
  Sun,
  X
} from "lucide-react";

import { navigationItems } from "@/lib/mock/app-data";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/journal": "Journal",
  "/journal/new": "New Journal",
  "/mood-history": "Mood History",
  "/reflections": "AI Reflections",
  "/assistant": "Assistant",
  "/analytics": "Analytics",
  "/profile": "Profile",
  "/settings": "Settings"
};

export function ProtectedAppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
  const title = useMemo(() => titles[pathname] ?? (pathname.startsWith("/journal/") ? "Journal Detail" : "MindCare"), [pathname]);

  function toggleTheme() {
    setDark((value) => {
      const next = !value;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(180,210,196,0.28),transparent_34%),radial-gradient(circle_at_top_right,rgba(226,203,182,0.24),transparent_28%)]" />
      <Sidebar collapsed={collapsed} pathname={pathname} onCollapse={() => setCollapsed(!collapsed)} />
      <MobileDrawer open={mobileOpen} pathname={pathname} onClose={() => setMobileOpen(false)} />
      <div className={cn("transition-all duration-300 lg:pl-72", collapsed && "lg:pl-24")}>
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#faf9f6]/85 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/80">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden dark:text-stone-300 dark:hover:bg-stone-900" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-stone-500">MindCare / {title}</div>
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 md:flex dark:border-stone-800 dark:bg-stone-900">
              <Search className="size-4 text-stone-400" />
              <span className="text-sm text-stone-400">Search journals, moods, reflections</span>
            </div>
            <IconButton label="Notifications">
              <Bell className="size-5" />
            </IconButton>
            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </IconButton>
            <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">AM</span>
              <ChevronsUpDown className="hidden size-4 text-stone-400 sm:block" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, pathname, onCollapse }: { collapsed: boolean; pathname: string; onCollapse: () => void }) {
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-stone-200/70 bg-white/80 p-3 backdrop-blur-xl transition-all duration-300 lg:block dark:border-stone-800 dark:bg-stone-950/80", collapsed ? "w-24" : "w-72")}>
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-stone-950 text-sm font-semibold text-white dark:bg-stone-50 dark:text-stone-950">MC</span>
            {!collapsed && <span className="text-sm font-semibold tracking-tight">MindCare AI</span>}
          </Link>
          <button onClick={onCollapse} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-900">
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
        <nav className="mt-6 space-y-1">
          {navigationItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return <NavLink key={item.href} item={item} active={active} collapsed={collapsed} />;
          })}
        </nav>
        {!collapsed && (
          <div className="mt-auto rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <div className="font-medium">Quiet streak</div>
            <p className="mt-1 text-emerald-800/80 dark:text-emerald-200/80">12 reflective days this month.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileDrawer({ open, pathname, onClose }: { open: boolean; pathname: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-stone-950/30" onClick={onClose} aria-label="Close navigation" />
      <div className="absolute inset-y-0 left-0 w-80 max-w-[86vw] border-r border-stone-200 bg-white p-4 shadow-2xl dark:border-stone-800 dark:bg-stone-950">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-semibold">MindCare AI</span>
          <button className="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-900" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href)} onClick={onClose} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavLink({ item, active, collapsed, onClick }: { item: (typeof navigationItems)[number]; active: boolean; collapsed?: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-white",
        active && "bg-stone-950 text-white shadow-sm hover:bg-stone-950 hover:text-white dark:bg-stone-100 dark:text-stone-950",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid size-10 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
      {children}
    </button>
  );
}
