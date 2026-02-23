"use client";

import React from "react";
import Link from "next/link";
import { CaseLinksOverridesProvider } from "@/lib/case-links-overrides";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/Avatar/Avatar";
import NavigationBar from "@/components/NavigationBar/NavigationBar";
import type { NavigationItem } from "@/components/NavigationBar/NavigationBar";
import { type DensityMode, useDensityPreference } from "@/lib/density";
import { cn } from "@/lib/utils";

/* ─── Nav items ─────────────────────────────────────────────────────────── */

const navItems: NavigationItem[] = [
  { id: "home", label: "Home", icon: "home", href: "/crm" },
  { id: "cases", label: "Cases", icon: "inbox", href: "/crm/cases" },
  { id: "pipeline", label: "Sales Pipeline", icon: "trending_up", href: "/crm/pipeline" },
  {
    id: "customer-management",
    label: "Customer Management",
    icon: "people",
    href: "/crm/customer",
    children: [
      { id: "org-management", label: "Org Management", href: "/crm/customer/orgs" },
      { id: "account-management", label: "Account management", href: "/crm/customer/accounts" },
      { id: "contact-management", label: "Contact management", href: "/crm/customer/contacts" },
    ],
  },
];

const bottomNavItems: NavigationItem[] = [
  { id: "help", label: "Help & Support", icon: "help_outline", href: "#" },
  { id: "settings", label: "Settings", icon: "settings", href: "/crm/settings" },
];

/* ─── Layout ────────────────────────────────────────────────────────────── */

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navCollapsed, setNavCollapsed] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const { density, setDensity, resetToAuto, isAutoDetect } = useDensityPreference();
  const activeDensity: DensityMode | "auto" = isAutoDetect ? "auto" : density;

  // Theme state: "system" | "light" | "dark"
  const [theme, setThemeState] = React.useState<"system" | "light" | "dark">("system");

  // Initialise theme from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) {
      setThemeState(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else {
      setThemeState("system");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  // Listen for system preference changes when in "system" mode
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    // Apply current system preference
    document.documentElement.classList.toggle("dark", mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const applyTheme = (value: "system" | "light" | "dark") => {
    setThemeState(value);
    if (value === "system") {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      localStorage.setItem("theme", value);
      document.documentElement.classList.toggle("dark", value === "dark");
    }
  };

  // Close profile dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  // Determine default active nav id from pathname
  const defaultActiveId = pathname === "/crm" || pathname === "/crm/"
    ? "home"
    : pathname.startsWith("/crm/changelog")
      ? "home"
      : pathname.startsWith("/crm/customer/contacts")
        ? "contact-management"
        : pathname.startsWith("/crm/customer/accounts")
          ? "account-management"
          : pathname.startsWith("/crm/customer/orgs")
            ? "org-management"
            : pathname.startsWith("/crm/customer")
              ? "customer-management"
              : pathname.startsWith("/crm/cases")
                ? "cases"
                : pathname.startsWith("/crm/pipeline")
                  ? "pipeline"
                  : pathname.startsWith("/crm/settings")
                    ? "settings"
                    : "cases";

  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden bg-[#F9F9FB] dark:bg-gray-900">
      {/* ── Brand strip ──────────────────────────────────────────────── */}
      <div className="h-1 shrink-0 bg-[#00C1FF]" />
      {/* ── App Bar ──────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-white px-4 dark:bg-gray-800">
        {/* Logo + version */}
        <div className="mr-6 flex items-center gap-3">
          <Link href="/crm" className="flex items-center">
            <Image
              src="/Tally_CRM_Logo.svg"
              alt="Tally CRM"
              width={140}
              height={40}
              className="block h-8 w-auto dark:hidden"
              priority
            />
            <Image
              src="/Tally_CRM_Logo_dark.svg"
              alt="Tally CRM"
              width={140}
              height={40}
              className="hidden h-8 w-auto dark:block"
              priority
            />
          </Link>
          <Link
            href="/crm/changelog"
            className="text-muted-foreground hover:text-[#2C365D] hover:underline dark:hover:text-[#7c8cb8]"
            style={{ fontSize: "var(--tally-font-size-xs)" }}
          >
            Version 0.1
          </Link>
        </div>

        {/* Search */}
        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-density-md border border-border bg-gray-50 px-3 dark:bg-gray-700">
          <Icon name="search" size="var(--tally-icon-size-md)" className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cases, accounts, opportunities…"
            className="w-full bg-transparent py-2 outline-none placeholder:text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          />
        </div>

        {/* Right side */}
        <div className="ml-6 flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Notifications"
          >
            <Icon name="notifications" size={20} className="text-muted-foreground" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#2C365D]"
            >
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-density-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {/* User info */}
                <div className="border-b border-border px-4 py-3 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                    John Smith
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    john.smith@tally.com
                  </p>
                </div>

                {/* Density setting */}
                <div className="border-b border-border px-4 py-3 dark:border-gray-700">
                  <p className="mb-2 font-medium text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    Display Density
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { value: "auto", label: "Auto" },
                      { value: "compact", label: "Compact" },
                      { value: "normal", label: "Default" },
                      { value: "comfortable", label: "Comfortable" },
                    ] as { value: DensityMode | "auto"; label: string }[]).map(
                      (opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (opt.value === "auto") resetToAuto();
                            else setDensity(opt.value);
                          }}
                          className={cn(
                            "rounded-md px-2.5 py-1.5 text-left transition-colors",
                            activeDensity === opt.value
                              ? "bg-[#2C365D] font-medium text-white dark:bg-[#7c8cb8]"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          )}
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {opt.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Appearance setting */}
                <div className="border-b border-border px-4 py-3 dark:border-gray-700">
                  <p className="mb-2 font-medium text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    Appearance
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { value: "system" as const, label: "System", icon: "desktop_windows" },
                      { value: "light" as const, label: "Light", icon: "light_mode" },
                      { value: "dark" as const, label: "Dark", icon: "dark_mode" },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => applyTheme(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-md px-2 py-2 transition-colors",
                          theme === opt.value
                            ? "bg-[#2C365D] font-medium text-white dark:bg-[#7c8cb8]"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        )}
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        <Icon
                          name={opt.icon}
                          size={16}
                          className={theme === opt.value ? "text-white" : "text-muted-foreground"}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    onClick={() => setProfileOpen(false)}
                  >
                    <Icon name="settings" size="var(--tally-icon-size-md)" className="text-muted-foreground" />
                    Settings
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    <Icon name="logout" size="var(--tally-icon-size-md)" className="text-muted-foreground" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── Expanded Navigation ─────────────────────────────────── */}
        <NavigationBar
          items={navItems}
          bottomItems={bottomNavItems}
          defaultActiveId={defaultActiveId}
          collapsed={navCollapsed}
          onCollapsedChange={setNavCollapsed}
        />

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex min-h-0 min-w-0 flex-1 bg-gradient-to-br from-sky-50/70 via-background to-blue-50/50 dark:from-sky-950/25 dark:via-background dark:to-blue-950/20">
          <CaseLinksOverridesProvider>{children}</CaseLinksOverridesProvider>
        </main>
      </div>
    </div>
  );
}
