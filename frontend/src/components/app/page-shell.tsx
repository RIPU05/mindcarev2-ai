"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  User as UserIcon,
  X
} from "lucide-react";

import { navigationItems } from "@/lib/mock/app-data";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/journal": "Journal",
  "/journal/new": "New Journal Entry",
  "/mood-history": "Mood History",
  "/reflections": "AI Reflections",
  "/assistant": "AI Assistant",
  "/analytics": "Analytics",
  "/profile": "Profile & Settings",
  "/settings": "Settings"
};

export function ProtectedAppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const title = useMemo(
    () => titles[pathname] ?? (pathname.startsWith("/journal/") ? "Journal Entry" : "MindCare AI"),
    [pathname]
  );

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  function toggleTheme() {
    setDark((value) => {
      const next = !value;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Background Soft Ambient Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-600/10 animate-ambient" />
        <div className="absolute top-1/4 -right-40 size-96 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-600/10 animate-ambient" style={{ animationDelay: "3s" }} />
        <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-600/10 animate-ambient" style={{ animationDelay: "5s" }} />
      </div>

      <Sidebar collapsed={collapsed} pathname={pathname} onCollapse={() => setCollapsed(!collapsed)} />
      <MobileDrawer open={mobileOpen} pathname={pathname} onClose={() => setMobileOpen(false)} />

      <div className={cn("transition-all duration-300 lg:pl-72", collapsed && "lg:pl-24")}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile navigation menu"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Sparkles className="size-3.5" /> Calm Intelligence
              </div>
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
            </div>

            <div className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2 text-sm md:flex dark:border-slate-800 dark:bg-slate-900/80">
              <Search className="size-4 text-slate-400" />
              <span className="text-slate-400">Search reflections, check-ins, assistant...</span>
            </div>

            <IconButton label="Notifications">
              <Bell className="size-5" />
            </IconButton>

            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {dark ? <Sun className="size-5 text-amber-400" /> : <Moon className="size-5 text-slate-600" />}
            </IconButton>

            {/* User Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User profile options menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-1.5 pr-3 text-sm shadow-sm transition hover:border-emerald-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm">
                  {initials}
                </span>
                <span className="hidden font-medium text-slate-700 sm:inline dark:text-slate-200">
                  {displayName}
                </span>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="size-4 text-emerald-600 dark:text-emerald-400" /> View Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="size-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  pathname,
  onCollapse
}: {
  collapsed: boolean;
  pathname: string;
  onCollapse: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white/85 p-4 backdrop-blur-xl transition-all duration-300 lg:block dark:border-slate-800/80 dark:bg-slate-950/85",
        collapsed ? "w-24" : "w-72"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Brand Emblem */}
        <div className="flex h-14 items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-3.5">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/25">
              <Sparkles className="size-5" />
            </span>
            {!collapsed && (
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  MindCare <span className="text-emerald-600 dark:text-emerald-400">AI</span>
                </span>
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Calm Intelligence
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 space-y-1.5">
          {navigationItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return <NavLink key={item.href} item={item} active={active} collapsed={collapsed} />;
          })}
        </nav>

        {/* Quiet Streak Widget */}
        {!collapsed && (
          <div className="mt-auto rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 p-4 text-sm text-emerald-950 dark:border-emerald-500/30 dark:text-emerald-100">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Quiet Streak
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
              12 reflective check-in days logged this month.
            </p>
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
      <button className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="Close navigation" />
      <div className="absolute inset-y-0 left-0 w-80 max-w-[86vw] border-r border-slate-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white">
              <Sparkles className="size-4" />
            </span>
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white">MindCare AI</span>
          </div>
          <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
              onClick={onClose}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onClick
}: {
  item: (typeof navigationItems)[number];
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold tracking-wide transition-all duration-200 text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/80 dark:hover:text-white",
        active &&
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:text-white dark:from-emerald-500 dark:to-teal-500 dark:text-white",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn("size-5 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400")} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}
