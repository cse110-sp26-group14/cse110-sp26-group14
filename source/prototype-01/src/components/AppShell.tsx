import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, CalendarDays, ListChecks, Bug, Users, Sparkles, Settings,
  Search, Bell, Activity, Menu, ClipboardCheck, CalendarClock,
  AlertTriangle, StickyNote, Wand2, ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/app-store";
import { ModalsHost } from "@/components/modals/ModalsHost";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/sprint-calendar", label: "Sprint Calendar", icon: CalendarDays },
  { to: "/backlog", label: "Backlog", icon: ListChecks },
  { to: "/issues", label: "Issues & Reports", icon: Bug },
  { to: "/team-availability", label: "Team Availability", icon: Users },
  { to: "/ai-log", label: "AI Log", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { project, sprint, users, currentUserId, setCurrentUserId, role, setRole, isAdmin, openModal } = useApp();
  const me = users.find((u) => u.id === currentUserId)!;

  const isActive = (to: string, exact?: boolean) => exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <BrandHeader />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = isActive(item.to, "exact" in item ? item.exact : false);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground font-mono">
          SE SitRep · v2.4
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
            <BrandHeader />
            <nav className="flex-1 px-3 py-4 space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                    <Icon className="size-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/70 backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6">
          <button className="lg:hidden size-9 rounded-md hover:bg-secondary flex items-center justify-center" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium">
              {project} <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Switch project</DropdownMenuLabel>
              <DropdownMenuItem>{project}</DropdownMenuItem>
              <DropdownMenuItem>Phoenix Mobile</DropdownMenuItem>
              <DropdownMenuItem>Internal Tools</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium" style={{ background: "var(--purple-soft)", color: "var(--purple)" }}>
            <span className="size-1.5 rounded-full" style={{ background: "var(--purple)" }} />
            {sprint.name}: {sprint.start} – {sprint.end}
          </span>

          <div className="relative ml-auto flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-9 bg-muted border-transparent" />
          </div>

          <button className="ml-auto sm:ml-0 size-9 rounded-md hover:bg-secondary flex items-center justify-center relative">
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg pl-1.5 pr-2 py-1 hover:bg-secondary">
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">{me.initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium">{me.name}</span>
                <span className="text-[10px] text-muted-foreground">{role}</span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch user</DropdownMenuLabel>
              {users.filter((u) => !u.isAgent).map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => setCurrentUserId(u.id)}>
                  {u.name} <span className="ml-auto text-xs text-muted-foreground">{u.role}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Role</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setRole("Admin")}>Admin {role === "Admin" && "✓"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("Member")}>Member {role === "Member" && "✓"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Quick action bar */}
        <div className="border-b border-border bg-card/40 px-4 lg:px-6 py-2.5 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium mr-1 hidden sm:inline">Quick actions</span>
          <QA icon={ClipboardCheck} label="Daily Check-In" onClick={() => openModal("checkin")} />
          <QA icon={CalendarClock} label="Availability Check" onClick={() => openModal("availability")} />
          <QA icon={AlertTriangle} label="Create Issue" onClick={() => openModal("createIssue")} />
          <QA icon={StickyNote} label="Add Note" onClick={() => openModal("addNote")} />
          {isAdmin && (
            <Button size="sm" onClick={() => openModal("aiSuggest")}
              className="ml-auto h-8 text-primary-foreground gap-1.5"
              style={{ background: "var(--gradient-brand)" }}>
              <Wand2 className="size-3.5" /> AI Sprint Task Suggestion
            </Button>
          )}
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur grid grid-cols-5">
          {nav.slice(0, 5).map((item) => {
            const active = isActive(item.to, "exact" in item ? item.exact : false);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="size-4" /> <span className="truncate max-w-full px-1">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <ModalsHost />
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
      <div className="size-8 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
        <Activity className="size-4" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-base font-semibold">SE SitRep</div>
        <div className="text-[10px] text-muted-foreground">Operations Center</div>
      </div>
    </div>
  );
}

function QA({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:bg-secondary transition-colors">
      <Icon className="size-3.5 text-primary" /> {label}
    </button>
  );
}
